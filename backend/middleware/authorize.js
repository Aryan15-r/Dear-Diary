const { db } = require('../db');

/**
 * Authorize access to a journal entry or child resource.
 * Supports both explicit access_grants AND promo code account connections.
 */
function authorizeResource(requiredPermission = 'read', resourceType = 'entry') {
    return async (req, res, next) => {
        const userId = req.user.id;
        const resourceId = req.params.id || req.params.entryId;

        if (!resourceId) {
            return res.status(400).json({ error: 'Resource ID is required.' });
        }

        let entryId = resourceId;

        try {
            // Resolve entry ID for child resources
            if (resourceType === 'audio') {
                const audioResult = await db.execute({
                    sql: `SELECT journal_entry_id FROM audio_entries WHERE id = ? AND deleted_at IS NULL`,
                    args: [resourceId]
                });
                if (audioResult.rows.length === 0) return res.status(404).json({ error: 'Resource unavailable.' });
                entryId = audioResult.rows[0].journal_entry_id;
            } else if (resourceType === 'transcript') {
                const transcriptResult = await db.execute({
                    sql: `
                        SELECT a.journal_entry_id 
                        FROM transcripts t
                        JOIN audio_entries a ON t.audio_entry_id = a.id
                        WHERE t.id = ? OR t.audio_entry_id = ?
                    `,
                    args: [resourceId, resourceId]
                });
                if (transcriptResult.rows.length === 0) return res.status(404).json({ error: 'Resource unavailable.' });
                entryId = transcriptResult.rows[0].journal_entry_id;
            } else if (resourceType === 'attachment') {
                const attachmentResult = await db.execute({
                    sql: `SELECT journal_entry_id FROM attachments WHERE id = ? AND deleted_at IS NULL`,
                    args: [resourceId]
                });
                if (attachmentResult.rows.length === 0) return res.status(404).json({ error: 'Resource unavailable.' });
                entryId = attachmentResult.rows[0].journal_entry_id;
            }

            // Fetch journal entry
            const entryResult = await db.execute({
                sql: `SELECT * FROM journal_entries WHERE id = ? AND deleted_at IS NULL`,
                args: [entryId]
            });
            if (entryResult.rows.length === 0) {
                return res.status(404).json({ error: 'Resource unavailable.' });
            }
            const entry = entryResult.rows[0];

            // 1. Check Owner
            if (entry.owner_user_id === userId) {
                req.entry = entry;
                req.userRole = 'owner';
                return next();
            }

            // 2. Check Promo Code Link (user_connections)
            const connectionResult = await db.execute({
                sql: `
                    SELECT id FROM user_connections 
                    WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
                `,
                args: [userId, entry.owner_user_id, entry.owner_user_id, userId]
            });

            if (connectionResult.rows.length > 0) {
                if (requiredPermission === 'read') {
                    req.entry = entry;
                    req.userRole = 'recipient';
                    return next();
                } else {
                    return res.status(403).json({ error: 'Action not permitted on connected entry.' });
                }
            }

            // 3. Check explicit access_grants
            const grantResult = await db.execute({
                sql: `
                    SELECT * FROM access_grants 
                    WHERE resource_id = ? 
                      AND recipient_user_id = ?
                      AND revoked_at IS NULL
                      AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
                `,
                args: [entryId, userId]
            });

            if (grantResult.rows.length > 0) {
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
        } catch (err) {
            console.error("Authorize middleware error:", err);
            return res.status(500).json({ error: 'Internal server error during authorization.' });
        }
    };
}

module.exports = { authorizeResource };
