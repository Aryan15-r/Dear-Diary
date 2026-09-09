const express = require('express');
const { db, generateUUID } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

// GET /entries — Paginated list of owned and connected entries
router.get('/', authenticate, (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 30, 100);
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search.trim()}%` : null;

        let query = `
            SELECT DISTINCT
                e.id, e.owner_user_id, e.title, e.body, e.mood, e.tags, e.entry_date, e.created_at, e.updated_at,
                (SELECT COUNT(*) FROM audio_entries a WHERE a.journal_entry_id = e.id AND a.deleted_at IS NULL) as audio_count
            FROM journal_entries e
            LEFT JOIN user_connections uc ON (uc.user_a = ? AND uc.user_b = e.owner_user_id)
            LEFT JOIN access_grants g ON (g.recipient_user_id = ? AND g.resource_id = e.id AND g.revoked_at IS NULL)
            WHERE (e.owner_user_id = ? OR uc.id IS NOT NULL OR g.id IS NOT NULL)
              AND e.deleted_at IS NULL
        `;
        const params = [userId, userId, userId];

        if (search) {
            query += ` AND (e.title LIKE ? OR e.body LIKE ? OR e.tags LIKE ?)`;
            params.push(search, search, search);
        }

        query += ` ORDER BY e.entry_date DESC, e.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        let entries = db.prepare(query).all(...params);

        entries = entries.map(e => ({
            ...e,
            tags: e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        }));

        return res.json({
            entries,
            page,
            limit
        });
    } catch (err) {
        console.error('Fetch entries error:', err);
        return res.status(500).json({ error: 'Failed to retrieve entries.' });
    }
});

// POST /entries — Create new entry
router.post('/', authenticate, (req, res) => {
    try {
        const { title, body, mood, tags, entryDate } = req.body;
        const ownerId = req.user.id;

        if (!title && !body) {
            return res.status(400).json({ error: 'Please enter a title or journal text.' });
        }

        const entryId = generateUUID();
        const date = entryDate || new Date().toISOString().split('T')[0];
        const tagString = Array.isArray(tags) ? tags.join(',') : (tags || '');

        db.prepare(`
            INSERT INTO journal_entries (id, owner_user_id, title, body, mood, tags, entry_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(entryId, ownerId, title || 'Untitled Entry', body || '', mood || null, tagString, date);

        const newEntry = db.prepare(`SELECT * FROM journal_entries WHERE id = ?`).get(entryId);

        return res.status(201).json({
            message: 'Entry saved.',
            entry: {
                ...newEntry,
                tags: newEntry.tags ? newEntry.tags.split(',') : []
            }
        });
    } catch (err) {
        console.error('Create entry error:', err);
        return res.status(500).json({ error: 'Failed to save journal entry.' });
    }
});

// GET /entries/:id — Single entry details
router.get('/:id', authenticate, authorizeResource('read', 'entry'), (req, res) => {
    try {
        const entry = req.entry;

        const audio = db.prepare(`
            SELECT a.id, a.duration_seconds, a.mime_type, a.created_at,
                   t.id as transcript_id, t.text as transcript_text, t.status as transcript_status
            FROM audio_entries a
            LEFT JOIN transcripts t ON t.audio_entry_id = a.id
            WHERE a.journal_entry_id = ? AND a.deleted_at IS NULL
        `).all(entry.id);

        const attachments = db.prepare(`
            SELECT id, original_name, mime_type, size_bytes, created_at
            FROM attachments
            WHERE journal_entry_id = ? AND deleted_at IS NULL
        `).all(entry.id);

        return res.json({
            entry: {
                ...entry,
                tags: entry.tags ? entry.tags.split(',').filter(Boolean) : [],
                audio,
                attachments
            }
        });
    } catch (err) {
        console.error('Get entry details error:', err);
        return res.status(500).json({ error: 'Failed to fetch entry details.' });
    }
});

// PATCH /entries/:id — Update entry
router.patch('/:id', authenticate, authorizeResource('edit', 'entry'), (req, res) => {
    try {
        const { title, body, mood, tags, entryDate } = req.body;
        const entryId = req.params.id;

        const existing = req.entry;
        const updatedTitle = title !== undefined ? title : existing.title;
        const updatedBody = body !== undefined ? body : existing.body;
        const updatedMood = mood !== undefined ? mood : existing.mood;
        const updatedDate = entryDate !== undefined ? entryDate : existing.entry_date;
        const updatedTags = Array.isArray(tags) ? tags.join(',') : (tags !== undefined ? tags : existing.tags);

        db.prepare(`
            UPDATE journal_entries
            SET title = ?, body = ?, mood = ?, tags = ?, entry_date = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(updatedTitle, updatedBody, updatedMood, updatedTags, updatedDate, entryId);

        const updated = db.prepare(`SELECT * FROM journal_entries WHERE id = ?`).get(entryId);

        return res.json({
            message: 'Entry updated successfully.',
            entry: {
                ...updated,
                tags: updated.tags ? updated.tags.split(',').filter(Boolean) : []
            }
        });
    } catch (err) {
        console.error('Update entry error:', err);
        return res.status(500).json({ error: 'Failed to update entry.' });
    }
});

// DELETE /entries/:id — Delete entry
router.delete('/:id', authenticate, authorizeResource('delete', 'entry'), (req, res) => {
    try {
        const entryId = req.params.id;
        db.prepare(`UPDATE journal_entries SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(entryId);
        return res.json({ message: 'Entry deleted.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete entry.' });
    }
});

module.exports = router;
