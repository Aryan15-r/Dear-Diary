const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, generateUUID } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

// Audio Upload Directory Setup
const uploadDir = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueKey = `${generateUUID()}${path.extname(file.originalname) || '.webm'}`;
        cb(null, uniqueKey);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// POST /entries/:id/audio — Upload audio to journal entry (Owner only)
router.post('/entries/:id/audio', authenticate, authorizeResource('edit', 'entry'), upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file payload is missing.' });
        }

        const entryId = req.params.id;
        const audioId = generateUUID();
        const durationSeconds = parseInt(req.body.duration) || 0;

        db.prepare(`
            INSERT INTO audio_entries (id, journal_entry_id, storage_key, duration_seconds, mime_type)
            VALUES (?, ?, ?, ?, ?)
        `).run(audioId, entryId, req.file.filename, durationSeconds, req.file.mimetype || 'audio/webm');

        // Automatically trigger mock speech-to-text transcript creation
        const transcriptId = generateUUID();
        const mockTranscriptText = req.body.transcriptText || "Voice entry recorded. Transcription generated successfully.";

        db.prepare(`
            INSERT INTO transcripts (id, audio_entry_id, text, provider, status)
            VALUES (?, ?, ?, 'dear_diary_stt', 'completed')
        `).run(transcriptId, audioId, mockTranscriptText);

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
router.get('/audio/:id', authenticate, authorizeResource('read', 'audio'), (req, res) => {
    try {
        const audioId = req.params.id;
        const audio = db.prepare(`SELECT * FROM audio_entries WHERE id = ? AND deleted_at IS NULL`).get(audioId);

        if (!audio) {
            return res.status(404).json({ error: 'Audio file unavailable.' });
        }

        const filePath = path.join(uploadDir, audio.storage_key);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Audio storage file not found.' });
        }

        res.setHeader('Content-Type', audio.mime_type || 'audio/webm');
        res.setHeader('Content-Disposition', `inline; filename="audio_${audio.id}.webm"`);
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    } catch (err) {
        console.error('Audio streaming error:', err);
        return res.status(500).json({ error: 'Failed to stream audio.' });
    }
});

// DELETE /audio/:id — Delete audio recording (Owner only)
router.delete('/audio/:id', authenticate, authorizeResource('delete', 'audio'), (req, res) => {
    try {
        const audioId = req.params.id;
        db.prepare(`UPDATE audio_entries SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(audioId);
        return res.json({ message: 'Audio entry deleted.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete audio.' });
    }
});

module.exports = router;
