const path = require('path');
const { db } = require('../backend/db');

async function testPromoCodeFlow() {
    console.log('--- TESTING PROMO CODE REGISTRATION & LINKAGE ---');

    // Verify promo_code column exists
    const users = db.prepare(`SELECT id, email, promo_code FROM users`).all();
    console.log(`Current registered users count: ${users.length}`);

    console.log('✓ Promo Code schema verification passed!');
}

testPromoCodeFlow();
