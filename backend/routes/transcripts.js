const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

// GET /audio/:id/transcript — Get transcript text (Same permissions as parent audio)
router.get('/audio/:id/transcript', authenticate, authorizeResource('read', 'audio'), async (req, res) => {
    try {
        const audioId = req.params.id;
        const transcriptResult = await db.execute({
            sql: `SELECT * FROM transcripts WHERE audio_entry_id = ?`,
            args: [audioId]
        });

        if (transcriptResult.rows.length === 0) {
            return res.status(404).json({ error: 'Transcript unavailable.' });
        }

        return res.json({ transcript: transcriptResult.rows[0] });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch transcript.' });
    }
});

// PATCH /audio/:id/transcript — Update transcript text (Owner only)
router.patch('/audio/:id/transcript', authenticate, authorizeResource('edit', 'audio'), async (req, res) => {
    try {
        const audioId = req.params.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Transcript text is required.' });
        }

        await db.execute({
            sql: `
                UPDATE transcripts
                SET text = ?, updated_at = CURRENT_TIMESTAMP
                WHERE audio_entry_id = ?
            `,
            args: [text, audioId]
        });

        const updatedResult = await db.execute({
            sql: `SELECT * FROM transcripts WHERE audio_entry_id = ?`,
            args: [audioId]
        });

        return res.json({ message: 'Transcript updated.', transcript: updatedResult.rows[0] });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update transcript.' });
    }
});

module.exports = router;
