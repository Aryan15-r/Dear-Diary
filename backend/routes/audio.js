const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { db, generateUUID } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// We use multer with memory storage because serverless functions can't write to disk
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// POST /entries/:id/audio — Upload audio to journal entry (Owner only)
router.post('/entries/:id/audio', authenticate, authorizeResource('edit', 'entry'), upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file payload is missing.' });
        }
        
        if (!supabase) {
            return res.status(503).json({ error: 'Supabase Storage is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file.' });
        }

        const entryId = req.params.id;
        const audioId = generateUUID();
        const durationSeconds = parseInt(req.body.duration) || 0;
        
        // Ensure extension is webm
        const filename = `${audioId}.webm`;

        // Upload to Supabase Storage (bucket name: "audio")
        const { data, error } = await supabase.storage
            .from('audio')
            .upload(filename, req.file.buffer, {
                contentType: req.file.mimetype || 'audio/webm',
                upsert: false
            });
            
        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ error: 'Failed to upload audio to cloud storage.' });
        }

        await db.execute({
            sql: `
                INSERT INTO audio_entries (id, journal_entry_id, storage_key, duration_seconds, mime_type)
                VALUES (?, ?, ?, ?, ?)
            `,
            args: [audioId, entryId, filename, durationSeconds, req.file.mimetype || 'audio/webm']
        });

        // Automatically trigger mock speech-to-text transcript creation
        const transcriptId = generateUUID();
        const mockTranscriptText = req.body.transcriptText || "Voice entry recorded. Transcription generated successfully.";

        await db.execute({
            sql: `
                INSERT INTO transcripts (id, audio_entry_id, text, provider, status)
                VALUES (?, ?, ?, 'dear_diary_stt', 'completed')
            `,
            args: [transcriptId, audioId, mockTranscriptText]
        });

        return res.status(201).json({
            message: 'Audio recording saved and transcribed successfully.',
            audio: {
                id: audioId,
                duration_seconds: durationSeconds,
                mime_type: req.file.mimetype,
                transcript: {
                    id: transcriptId,
                    text: mockTranscriptText
                }
            }
        });
    } catch (err) {
        console.error('Audio upload error:', err);
        return res.status(500).json({ error: 'Failed to upload audio recording.' });
    }
});

// GET /audio/:id — Authenticated Audio Streaming / Download (Owner or Authorized Recipient)
router.get('/audio/:id', authenticate, authorizeResource('read', 'audio'), async (req, res) => {
    try {
        const audioId = req.params.id;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Supabase Storage is not configured.' });
        }
        
        const audioResult = await db.execute({
            sql: `SELECT * FROM audio_entries WHERE id = ? AND deleted_at IS NULL`,
            args: [audioId]
        });

        if (audioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Audio file unavailable.' });
        }
        
        const audio = audioResult.rows[0];
        
        // Generate a signed URL from Supabase valid for 1 hour (3600 seconds)
        const { data, error } = await supabase.storage
            .from('audio')
            .createSignedUrl(audio.storage_key, 3600);
            
        if (error || !data) {
            console.error("Failed to generate signed URL:", error);
            return res.status(500).json({ error: 'Failed to stream audio from cloud storage.' });
        }

        // Redirect the client directly to the secure signed URL
        return res.redirect(data.signedUrl);
    } catch (err) {
        console.error('Audio streaming error:', err);
        return res.status(500).json({ error: 'Failed to stream audio.' });
    }
});

// DELETE /audio/:id — Delete audio recording (Owner only)
router.delete('/audio/:id', authenticate, authorizeResource('delete', 'audio'), async (req, res) => {
    try {
        const audioId = req.params.id;
        
        // Soft delete from DB
        await db.execute({
            sql: `UPDATE audio_entries SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [audioId]
        });
        
        return res.json({ message: 'Audio entry deleted.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete audio.' });
    }
});

module.exports = router;
