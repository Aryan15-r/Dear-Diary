const express = require('express');
const crypto = require('crypto');
const { db, generateUUID, hashToken } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

// POST /access/invitations — Create invitation link/token
router.post('/access/invitations', authenticate, async (req, res) => {
    try {
        const inviterId = req.user.id;
        const { inviteeEmail } = req.body;

        const rawToken = crypto.randomBytes(24).toString('hex');
        const tokenHash = hashToken(rawToken);
        const invitationId = generateUUID();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hrs

        await db.execute({
            sql: `
                INSERT INTO invitations (id, inviter_user_id, invitee_identifier, token_hash, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `,
            args: [invitationId, inviterId, inviteeEmail ? inviteeEmail.trim().toLowerCase() : null, tokenHash, expiresAt]
        });

        return res.status(201).json({
            message: 'Invitation generated successfully.',
            invitation: {
                id: invitationId,
                token: rawToken,
                expires_at: expiresAt
            }
        });
    } catch (err) {
        console.error('Create invitation error:', err);
        return res.status(500).json({ error: 'Failed to create invitation.' });
    }
});

// POST /access/invitations/accept — Accept invitation
router.post('/access/invitations/accept', authenticate, async (req, res) => {
    try {
        const { token } = req.body;
        const recipientId = req.user.id;

        if (!token) {
            return res.status(400).json({ error: 'Invitation token is required.' });
        }

        const tokenHash = hashToken(token);

        const invitationResult = await db.execute({
            sql: `
                SELECT * FROM invitations 
                WHERE token_hash = ?
                  AND accepted_at IS NULL
                  AND revoked_at IS NULL
                  AND datetime(expires_at) > datetime('now')
            `,
            args: [tokenHash]
        });

        if (invitationResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired invitation token.' });
        }
        
        const invitation = invitationResult.rows[0];

        if (invitation.inviter_user_id === recipientId) {
            return res.status(400).json({ error: 'You cannot accept your own invitation.' });
        }

        // Mark accepted inside transaction (LibSQL Batch)
        await db.batch([
            {
                sql: `UPDATE invitations SET accepted_at = CURRENT_TIMESTAMP WHERE id = ?`,
                args: [invitation.id]
            },
            {
                sql: `
                    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
                    VALUES (?, ?, 'INVITATION_ACCEPTED', 'invitation', ?)
                `,
                args: [generateUUID(), recipientId, invitation.id]
            }
        ], "write");

        return res.json({ message: 'Invitation accepted successfully.' });
    } catch (err) {
        console.error('Accept invitation error:', err);
        return res.status(500).json({ error: 'Failed to accept invitation.' });
    }
});

// POST /entries/:id/access — Grant recipient access to specific entry (Owner only)
router.post('/entries/:id/access', authenticate, authorizeResource('edit', 'entry'), async (req, res) => {
    try {
        const ownerId = req.user.id;
        const entryId = req.params.id;
        const { recipientEmail, recipientUserId } = req.body;

        let recipientResult = null;

        if (recipientUserId) {
            recipientResult = await db.execute({
                sql: `SELECT id, email, display_name FROM users WHERE id = ?`,
                args: [recipientUserId]
            });
        } else if (recipientEmail) {
            recipientResult = await db.execute({
                sql: `SELECT id, email, display_name FROM users WHERE email = ?`,
                args: [recipientEmail.trim().toLowerCase()]
            });
        }

        if (!recipientResult || recipientResult.rows.length === 0) {
            return res.status(404).json({ error: 'User account not found.' });
        }
        
        const recipient = recipientResult.rows[0];

        if (recipient.id === ownerId) {
            return res.status(400).json({ error: 'Owner already has full access.' });
        }

        // Check if active grant already exists
        const existingGrantResult = await db.execute({
            sql: `
                SELECT id FROM access_grants 
                WHERE resource_id = ? AND recipient_user_id = ? AND revoked_at IS NULL
            `,
            args: [entryId, recipient.id]
        });

        if (existingGrantResult.rows.length > 0) {
            return res.json({ message: 'Access is already granted to this account.', grantId: existingGrantResult.rows[0].id });
        }

        const grantId = generateUUID();

        await db.execute({
            sql: `
                INSERT INTO access_grants (id, owner_user_id, recipient_user_id, resource_type, resource_id, permission)
                VALUES (?, ?, ?, 'journal_entry', ?, 'read')
            `,
            args: [grantId, ownerId, recipient.id, entryId]
        });

        // Audit log
        await db.execute({
            sql: `
                INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
                VALUES (?, ?, 'ACCESS_GRANTED', 'journal_entry', ?)
            `,
            args: [generateUUID(), ownerId, entryId]
        });

        return res.status(201).json({
            message: 'Access granted successfully.',
            grant: {
                id: grantId,
                recipient_email: recipient.email,
                recipient_name: recipient.display_name
            }
        });
    } catch (err) {
        console.error('Grant access error:', err);
        return res.status(500).json({ error: 'Failed to grant access.' });
    }
});

// DELETE /entries/:id/access/:grantId — Revoke access grant immediately (Owner only)
router.delete('/entries/:id/access/:grantId', authenticate, authorizeResource('edit', 'entry'), async (req, res) => {
    try {
        const { grantId } = req.params;
        const ownerId = req.user.id;

        await db.execute({
            sql: `
                UPDATE access_grants 
                SET revoked_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND owner_user_id = ?
            `,
            args: [grantId, ownerId]
        });

        // Audit log
        await db.execute({
            sql: `
                INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
                VALUES (?, ?, 'ACCESS_REVOKED', 'access_grant', ?)
            `,
            args: [generateUUID(), ownerId, grantId]
        });

        return res.json({ message: 'Access revoked immediately.' });
    } catch (err) {
        console.error('Revoke access error:', err);
        return res.status(500).json({ error: 'Failed to revoke access.' });
    }
});

// GET /access/grants — List active grants given or received
router.get('/access/grants', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        const givenGrantsResult = await db.execute({
            sql: `
                SELECT g.id, g.resource_id, g.created_at, u.email as recipient_email, u.display_name as recipient_name, e.title as entry_title
                FROM access_grants g
                JOIN users u ON g.recipient_user_id = u.id
                JOIN journal_entries e ON g.resource_id = e.id
                WHERE g.owner_user_id = ? AND g.revoked_at IS NULL AND e.deleted_at IS NULL
            `,
            args: [userId]
        });

        const receivedGrantsResult = await db.execute({
            sql: `
                SELECT g.id, g.resource_id, g.created_at, u.display_name as owner_name, e.title as entry_title
                FROM access_grants g
                JOIN users u ON g.owner_user_id = u.id
                JOIN journal_entries e ON g.resource_id = e.id
                WHERE g.recipient_user_id = ? AND g.revoked_at IS NULL AND e.deleted_at IS NULL
            `,
            args: [userId]
        });

        return res.json({ givenGrants: givenGrantsResult.rows, receivedGrants: receivedGrantsResult.rows });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch access grants.' });
    }
});

module.exports = router;
