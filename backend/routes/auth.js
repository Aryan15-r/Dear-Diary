const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { db, generateUUID, hashToken, generatePromoCode } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Register new independent user account (Atomic Registration + Auto-Login)
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, promoCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }

        const existingUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase().trim());
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const userId = generateUUID();
        const passwordHash = await bcrypt.hash(password, 12);
        const name = displayName ? displayName.trim() : email.split('@')[0];

        // Generate unique promo code for new account
        let userPromoCode = generatePromoCode();
        while (db.prepare(`SELECT id FROM users WHERE promo_code = ?`).get(userPromoCode)) {
            userPromoCode = generatePromoCode();
        }

        db.prepare(`
            INSERT INTO users (id, email, password_hash, display_name, promo_code)
            VALUES (?, ?, ?, ?, ?)
        `).run(userId, email.toLowerCase().trim(), passwordHash, name, userPromoCode);

        // Process Promo Code linkage if supplied during registration
        if (promoCode && promoCode.trim()) {
            const cleanCode = promoCode.trim().toUpperCase();
            const inviter = db.prepare(`SELECT id FROM users WHERE promo_code = ?`).get(cleanCode);

            if (inviter && inviter.id !== userId) {
                const connId1 = generateUUID();
                const connId2 = generateUUID();

                db.transaction(() => {
                    db.prepare(`INSERT OR IGNORE INTO user_connections (id, user_a, user_b) VALUES (?, ?, ?)`).run(connId1, userId, inviter.id);
                    db.prepare(`INSERT OR IGNORE INTO user_connections (id, user_a, user_b) VALUES (?, ?, ?)`).run(connId2, inviter.id, userId);
                })();
            }
        }

        // Create session token and set HTTP-only cookie directly (Atomic Auto-Login)
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const sessionId = generateUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO sessions (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(sessionId, userId, tokenHash, expiresAt);

        res.cookie('session_token', rawToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
            VALUES (?, ?, 'USER_REGISTER', 'user', ?)
        `).run(generateUUID(), userId, userId);

        return res.status(201).json({
            message: 'Account created successfully.',
            user: { id: userId, email: email.toLowerCase().trim(), displayName: name, promoCode: userPromoCode }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        let user = db.prepare(`SELECT * FROM users WHERE email = ? AND status = 'active'`).get(email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.promo_code) {
            let code = generatePromoCode();
            db.prepare(`UPDATE users SET promo_code = ? WHERE id = ?`).run(code, user.id);
            user.promo_code = code;
        }

        // Create session
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const sessionId = generateUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO sessions (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(sessionId, user.id, tokenHash, expiresAt);

        res.cookie('session_token', rawToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return res.json({
            message: 'Logged in successfully.',
            user: { id: user.id, email: user.email, displayName: user.display_name, promoCode: user.promo_code }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// Google Sign-In — verifies the real Google Identity Services credential token
router.post('/google', async (req, res) => {
    try {
        const { credential, isRegistering } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Missing Google credential token.' });
        }

        if (!GOOGLE_CLIENT_ID) {
            return res.status(503).json({ error: 'Google Sign-In is not configured on this server. Please set GOOGLE_CLIENT_ID in the backend .env file.' });
        }

        // Verify the ID token with Google's public keys
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (verifyErr) {
            console.error('Google token verification failed:', verifyErr.message);
            return res.status(401).json({ error: 'Invalid or expired Google credential. Please try again.' });
        }

        const userEmail = payload.email.toLowerCase().trim();
        const name = payload.name || payload.given_name || userEmail.split('@')[0];

        // Find or create the user
        let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(userEmail);

        if (!user) {
            if (!isRegistering) {
                return res.status(401).json({ error: 'No account found for this Google email. Please create an account first.' });
            }
            
            const userId = generateUUID();
            // Use a secure random password hash (not guessable — Google SSO users never need it)
            const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
            let userPromoCode = generatePromoCode();
            while (db.prepare(`SELECT id FROM users WHERE promo_code = ?`).get(userPromoCode)) {
                userPromoCode = generatePromoCode();
            }

            db.prepare(`
                INSERT INTO users (id, email, password_hash, display_name, promo_code)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId, userEmail, passwordHash, name, userPromoCode);

            user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

            db.prepare(`
                INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id)
                VALUES (?, ?, 'GOOGLE_REGISTER', 'user', ?)
            `).run(generateUUID(), userId, userId);
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const sessionId = generateUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO sessions (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(sessionId, user.id, tokenHash, expiresAt);

        res.cookie('session_token', rawToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return res.json({
            message: 'Google Sign-In successful.',
            user: { id: user.id, email: user.email, displayName: user.display_name, promoCode: user.promo_code }
        });
    } catch (err) {
        console.error('Google Auth Error:', err);
        return res.status(500).json({ error: 'Google authentication failed.' });
    }
});

// Logout
router.post('/logout', authenticate, (req, res) => {
    try {
        db.prepare(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.sessionId);
        res.clearCookie('session_token');
        return res.json({ message: 'Logged out successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Logout failed.' });
    }
});

// Current Session Info
router.get('/session', authenticate, (req, res) => {
    const user = db.prepare(`SELECT id, email, display_name, promo_code FROM users WHERE id = ?`).get(req.user.id);
    return res.json({
        user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            promoCode: user.promo_code
        }
    });
});

module.exports = router;
