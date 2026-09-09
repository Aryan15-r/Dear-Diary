const express = require('express');
const crypto = require('crypto');
const { db, generateUUID, hashToken } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authorizeResource } = require('../middleware/authorize');

const router = express.Router();

// POST /access/invitations — Create invitation link/token
router.post('/access/invitations', authenticate, (req, res) => {
    try {
        const inviterId = req.user.id;
        const { inviteeEmail } = req.body;

        const rawToken = crypto.randomBytes(24).toString('hex');
        const tokenHash = hashToken(rawToken);
        const invitationId = generateUUID();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hrs

        db.prepare(`
            INSERT INTO invitations (id, inviter_user_id, invitee_identifier, token_hash, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(invitationId, inviterId, inviteeEmail ? inviteeEmail.trim().toLowerCase() : null, tokenHash, expiresAt);

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
router.post('/access/invitations/accept', authenticate, (req, res) => {
    try {
        const { token } = req.body;
        const recipientId = req.user.id;

        if (!token) {
            return res.status(400).json({ error: 'Invitation token is required.' });
        }

        const tokenHash = hashToken(token);

        const invitation = db.prepare(`
            SELECT * FROM invitations 
            WHERE token_hash = ?
              AND accepted_at IS NULL
              AND revoked_at IS NULL
              AND datetime(expires_at) > datetime('now')
        `).get(tokenHash);

        if (!invitation) {
            return res.status(400).json({ error: 'Invalid or expired invitation token.' });
        }

        if (invitation.inviter_user_id === recipientId) {
            return res.status(400).json({ error: 'You cannot accept your own invitation.' });
        }

        // Mark accepted inside transaction
        db.transaction(() => {
            db.prepare(`UPDATE invitations SET accepted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(invitation.id);

            // Audit log
            db.prepare(`
                INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
                VALUES (?, ?, 'INVITATION_ACCEPTED', 'invitation', ?)
            `).run(generateUUID(), recipientId, invitation.id);
        })();

        return res.json({ message: 'Invitation accepted successfully.' });
    } catch (err) {
        console.error('Accept invitation error:', err);
        return res.status(500).json({ error: 'Failed to accept invitation.' });
    }
});

// POST /entries/:id/access — Grant recipient access to specific entry (Owner only)
router.post('/entries/:id/access', authenticate, authorizeResource('edit', 'entry'), (req, res) => {
    try {
        const ownerId = req.user.id;
        const entryId = req.params.id;
        const { recipientEmail, recipientUserId } = req.body;

        let recipient = null;

        if (recipientUserId) {
            recipient = db.prepare(`SELECT id, email, display_name FROM users WHERE id = ?`).get(recipientUserId);
        } else if (recipientEmail) {
            recipient = db.prepare(`SELECT id, email, display_name FROM users WHERE email = ?`).get(recipientEmail.trim().toLowerCase());
        }

        if (!recipient) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        if (recipient.id === ownerId) {
            return res.status(400).json({ error: 'Owner already has full access.' });
        }

        // Check if active grant already exists
        const existingGrant = db.prepare(`
            SELECT id FROM access_grants 
            WHERE resource_id = ? AND recipient_user_id = ? AND revoked_at IS NULL
        `).get(entryId, recipient.id);

        if (existingGrant) {
            return res.json({ message: 'Access is already granted to this account.', grantId: existingGrant.id });
        }

        const grantId = generateUUID();

        db.prepare(`
            INSERT INTO access_grants (id, owner_user_id, recipient_user_id, resource_type, resource_id, permission)
            VALUES (?, ?, ?, 'journal_entry', ?, 'read')
        `).run(grantId, ownerId, recipient.id, entryId);

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
            VALUES (?, ?, 'ACCESS_GRANTED', 'journal_entry', ?)
        `).run(generateUUID(), ownerId, entryId);

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
router.delete('/entries/:id/access/:grantId', authenticate, authorizeResource('edit', 'entry'), (req, res) => {
    try {
        const { grantId } = req.params;
        const ownerId = req.user.id;

        db.prepare(`
            UPDATE access_grants 
            SET revoked_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND owner_user_id = ?
        `).run(grantId, ownerId);

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
            VALUES (?, ?, 'ACCESS_REVOKED', 'access_grant', ?)
        `).run(generateUUID(), ownerId, grantId);

        return res.json({ message: 'Access revoked immediately.' });
    } catch (err) {
        console.error('Revoke access error:', err);
        return res.status(500).json({ error: 'Failed to revoke access.' });
    }
});

// GET /access/grants — List active grants given or received
router.get('/access/grants', authenticate, (req, res) => {
    try {
        const userId = req.user.id;

        const givenGrants = db.prepare(`
            SELECT g.id, g.resource_id, g.created_at, u.email as recipient_email, u.display_name as recipient_name, e.title as entry_title
            FROM access_grants g
            JOIN users u ON g.recipient_user_id = u.id
            JOIN journal_entries e ON g.resource_id = e.id
            WHERE g.owner_user_id = ? AND g.revoked_at IS NULL AND e.deleted_at IS NULL
        `).all(userId);

        const receivedGrants = db.prepare(`
            SELECT g.id, g.resource_id, g.created_at, u.display_name as owner_name, e.title as entry_title
            FROM access_grants g
            JOIN users u ON g.owner_user_id = u.id
            JOIN journal_entries e ON g.resource_id = e.id
            WHERE g.recipient_user_id = ? AND g.revoked_at IS NULL AND e.deleted_at IS NULL
        `).all(userId);

        return res.json({ givenGrants, receivedGrants });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch access grants.' });
    }
});

module.exports = router;
