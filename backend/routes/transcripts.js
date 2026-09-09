const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

// GET /audio/:id/transcript — Get transcript text (Same permissions as parent audio)
router.get('/audio/:id/transcript', authenticate, authorizeResource('read', 'audio'), (req, res) => {
    try {
        const audioId = req.params.id;
        const transcript = db.prepare(`SELECT * FROM transcripts WHERE audio_entry_id = ?`).get(audioId);

        if (!transcript) {
            return res.status(404).json({ error: 'Transcript unavailable.' });
        }

        return res.json({ transcript });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch transcript.' });
    }
});

// PATCH /audio/:id/transcript — Update transcript text (Owner only)
router.patch('/audio/:id/transcript', authenticate, authorizeResource('edit', 'audio'), (req, res) => {
    try {
        const audioId = req.params.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Transcript text is required.' });
        }

        db.prepare(`
            UPDATE transcripts
            SET text = ?, updated_at = CURRENT_TIMESTAMP
            WHERE audio_entry_id = ?
        `).run(text, audioId);

        const updated = db.prepare(`SELECT * FROM transcripts WHERE audio_entry_id = ?`).get(audioId);

        return res.json({ message: 'Transcript updated.', transcript: updated });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update transcript.' });
    }
});

module.exports = router;
