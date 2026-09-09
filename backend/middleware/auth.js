const { db, hashToken } = require('../db');

async function authenticate(req, res, next) {
    let token = null;
    
    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.session_token) {
        token = req.cookies.session_token;
    } 
    // Fallback to Bearer token header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const tokenHash = hashToken(token);

    try {
        const sessionResult = await db.execute({
            sql: `
                SELECT s.*, u.email, u.display_name, u.status
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token_hash = ? 
                  AND s.revoked_at IS NULL 
                  AND datetime(s.expires_at) > datetime('now')
                  AND u.status = 'active'
            `,
            args: [tokenHash]
        });

        const session = sessionResult.rows[0];

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
        }

        // Update last seen asynchronously (fire and forget)
        db.execute({
            sql: `UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [session.id]
        }).catch(err => console.error("Failed to update last_seen_at:", err));

        req.user = {
            id: session.user_id,
            email: session.email,
            displayName: session.display_name
        };
        req.sessionId = session.id;

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(500).json({ error: 'Internal server error during authentication.' });
    }
}

module.exports = { authenticate };
