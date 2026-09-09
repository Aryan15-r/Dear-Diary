const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'dear_diary.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Add missing columns to legacy tables prior to schema execution
try {
    const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
    if (userColumns.length > 0) {
        const hasPromo = userColumns.some(c => c.name === 'promo_code');
        if (!hasPromo) {
            db.exec(`ALTER TABLE users ADD COLUMN promo_code TEXT;`);
        }
    }
} catch (e) {
    // Table doesn't exist yet
}

// Initialize schema
if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
}

// Helper: Generate UUID
function generateUUID() {
    return crypto.randomUUID();
}

// Helper: Hash Tokens
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper: Generate Promo Code (e.g. JOURNAL-8X9K)
function generatePromoCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'JOURNAL-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = {
    db,
    generateUUID,
    hashToken,
    generatePromoCode
};
