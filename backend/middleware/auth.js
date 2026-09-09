const { db, hashToken } = require('../db');

function authenticate(req, res, next) {
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

    const session = db.prepare(`
        SELECT s.*, u.email, u.display_name, u.status
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token_hash = ? 
          AND s.revoked_at IS NULL 
          AND datetime(s.expires_at) > datetime('now')
          AND u.status = 'active'
    `).get(tokenHash);

    if (!session) {
        return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }

    // Update last seen asynchronously
    db.prepare(`UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`).run(session.id);

    req.user = {
        id: session.user_id,
        email: session.email,
        displayName: session.display_name
    };
    req.sessionId = session.id;

    next();
}

module.exports = { authenticate };
