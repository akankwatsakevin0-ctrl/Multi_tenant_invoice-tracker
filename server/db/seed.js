#!/usr/bin/env node

/**
 * Seed runner - executes the seed.sql file against the database.
 *
 * Usage:
 *   node db/seed.js          # Run seed data
 *   node db/seed.js --force  # Drop existing data before seeding
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function main() {
    const force = process.argv.includes('--force');

    if (force) {
        console.log('⚠️  --force flag detected. Truncating all existing data...');
        const truncateSQL = `
            TRUNCATE TABLE invoice_items, invoices, clients, users, tenants RESTART IDENTITY CASCADE;
        `;
        await pool.query(truncateSQL);
        console.log('   All tables truncated.\n');
    }

    const seedPath = path.resolve(__dirname, 'seed.sql');
    const sql = fs.readFileSync(seedPath, 'utf-8');

    console.log('🌱 Seeding database...');
    try {
        await pool.query(sql);
        console.log('✅ Seed data applied successfully.');
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }

    await pool.end();
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
