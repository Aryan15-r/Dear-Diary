const { db } = require('../db');

/**
 * Authorize access to a journal entry or child resource.
 * Supports both explicit access_grants AND promo code account connections.
 */
function authorizeResource(requiredPermission = 'read', resourceType = 'entry') {
    return (req, res, next) => {
        const userId = req.user.id;
        const resourceId = req.params.id || req.params.entryId;

        if (!resourceId) {
            return res.status(400).json({ error: 'Resource ID is required.' });
        }

        let entryId = resourceId;

        // Resolve entry ID for child resources
        if (resourceType === 'audio') {
            const audio = db.prepare(`SELECT journal_entry_id FROM audio_entries WHERE id = ? AND deleted_at IS NULL`).get(resourceId);
            if (!audio) return res.status(404).json({ error: 'Resource unavailable.' });
            entryId = audio.journal_entry_id;
        } else if (resourceType === 'transcript') {
            const transcript = db.prepare(`
                SELECT a.journal_entry_id 
                FROM transcripts t
                JOIN audio_entries a ON t.audio_entry_id = a.id
                WHERE t.id = ? OR t.audio_entry_id = ?
            `).get(resourceId, resourceId);
            if (!transcript) return res.status(404).json({ error: 'Resource unavailable.' });
            entryId = transcript.journal_entry_id;
        } else if (resourceType === 'attachment') {
            const attachment = db.prepare(`SELECT journal_entry_id FROM attachments WHERE id = ? AND deleted_at IS NULL`).get(resourceId);
            if (!attachment) return res.status(404).json({ error: 'Resource unavailable.' });
            entryId = attachment.journal_entry_id;
        }

        // Fetch journal entry
        const entry = db.prepare(`SELECT * FROM journal_entries WHERE id = ? AND deleted_at IS NULL`).get(entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Resource unavailable.' });
        }

        // 1. Check Owner
        if (entry.owner_user_id === userId) {
            req.entry = entry;
            req.userRole = 'owner';
            return next();
        }

        // 2. Check Promo Code Link (user_connections)
        const isConnected = db.prepare(`
            SELECT id FROM user_connections 
            WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
        `).get(userId, entry.owner_user_id, entry.owner_user_id, userId);

        if (isConnected) {
            if (requiredPermission === 'read') {
                req.entry = entry;
                req.userRole = 'recipient';
                return next();
            } else {
                return res.status(403).json({ error: 'Action not permitted on connected entry.' });
            }
        }

        // 3. Check explicit access_grants
        const grant = db.prepare(`
            SELECT * FROM access_grants 
            WHERE resource_id = ? 
              AND recipient_user_id = ?
              AND revoked_at IS NULL
              AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
        `).get(entryId, userId);

        if (grant) {
            if (requiredPermission === 'read') {
                req.entry = entry;
                req.userRole = 'recipient';
                return next();
            } else {
                return res.status(403).json({ error: 'Action not permitted on shared entry.' });
            }
        }

        // 4. Deny by default
        return res.status(403).json({ error: 'Access denied.' });
    };
}

module.exports = { authorizeResource };
