const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'dear_diary.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

// Ensure directory exists if using local file
if (!process.env.TURSO_DATABASE_URL) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

const url = process.env.TURSO_DATABASE_URL || `file:${dbPath}`;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const db = createClient({ url, authToken });

async function initDB() {
    // Enable foreign keys for local SQLite (Turso manages this server-side)
    if (!process.env.TURSO_DATABASE_URL) {
        await db.execute('PRAGMA foreign_keys = ON;');
    }

    // Add missing columns to legacy tables prior to schema execution
    try {
        const userColumns = await db.execute(`PRAGMA table_info(users)`);
        if (userColumns.rows.length > 0) {
            const hasPromo = userColumns.rows.some(c => c.name === 'promo_code');
            if (!hasPromo) {
                await db.execute(`ALTER TABLE users ADD COLUMN promo_code TEXT;`);
            }
        }
    } catch (e) {
        // Table doesn't exist yet
    }

    // Initialize schema
    if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await db.executeMultiple(schemaSql);
    }
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
    initDB,
    generateUUID,
    hashToken,
    generatePromoCode
};
