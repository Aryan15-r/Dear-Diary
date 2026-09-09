const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const audioRoutes = require('./routes/audio');
const transcriptRoutes = require('./routes/transcripts');
const accessRoutes = require('./routes/access');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

// Production Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.googleusercontent.com; media-src 'self' blob:; connect-src 'self' https://accounts.google.com; frame-src https://accounts.google.com;");
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    next();
});

// API Routes
app.use('/auth', authRoutes);
app.use('/entries', entriesRoutes);
app.use('/', audioRoutes);
app.use('/', transcriptRoutes);
app.use('/', accessRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Dear Diary API', timestamp: new Date().toISOString() });
});

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, '..', 'public');
app.use(express.static(frontendPath));

// SPA Fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/entries') || req.path.startsWith('/audio') || req.path.startsWith('/access') || req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found.' });
    }
    const indexPath = path.join(frontendPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('Dear Diary API Server Running.');
    }
});

// Start Server
if (require.main === module) {
    initDB().then(() => {
        app.listen(PORT, () => {
            console.log(`[Dear Diary Backend] Listening on http://localhost:${PORT}`);
        });
    }).catch(err => {
        console.error("Failed to initialize database:", err);
        process.exit(1);
    });
}

module.exports = app;
