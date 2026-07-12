#!/usr/bin/env node

/**
 * Simple SQL-based migration runner for PostgreSQL.
 * Reads .sql files from the migrations folder in order and applies them.
 *
 * Usage:
 *   node migrate.js up          # Apply pending migrations
 *   node migrate.js down        # Rollback last migration (if down script exists)
 *   node migrate.js status      # Show migration status
 *   node migrate.js create <name>  # Create a new migration file
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'migrations';

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensureMigrationsTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
            id          SERIAL PRIMARY KEY,
            version     VARCHAR(10) NOT NULL UNIQUE,
            name        VARCHAR(255) NOT NULL,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            rollback_at TIMESTAMPTZ
        );
    `;
    await pool.query(sql);
}

async function getAppliedMigrations() {
    const { rows } = await pool.query(
        `SELECT version, name, applied_at FROM ${MIGRATIONS_TABLE} ORDER BY version ASC`
    );
    return rows;
}

function getMigrationFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql') && !f.includes('down'))
        .sort();
}

function parseVersion(filename) {
    const match = filename.match(/^(\d+)/);
    return match ? match[1] : filename;
}

function getDownFile(upFile) {
    const base = path.basename(upFile, '.sql');
    const downFile = path.join(MIGRATIONS_DIR, `${base}_down.sql`);
    return fs.existsSync(downFile) ? downFile : null;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdUp() {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));
    const files = getMigrationFiles();

    let pending = files.filter((f) => !appliedVersions.has(parseVersion(f)));

    if (pending.length === 0) {
        console.log('✅ No pending migrations.');
        await pool.end();
        return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
        const version = parseVersion(file);
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        console.log(`⬆️  Applying ${file}...`);

        try {
            await pool.query('BEGIN');

            // Run the migration SQL
            await pool.query(sql);

            // Record migration
            await pool.query(
                `INSERT INTO ${MIGRATIONS_TABLE} (version, name) VALUES ($1, $2)`,
                [version, file.replace('.sql', '')]
            );

            await pool.query('COMMIT');
            console.log(`   ✅ ${file} applied successfully.`);
        } catch (err) {
            await pool.query('ROLLBACK');
            console.error(`   ❌ ${file} FAILED: ${err.message}`);
            console.error(err);
            await pool.end();
            process.exit(1);
        }
    }

    console.log('\n✅ All pending migrations applied.');
    await pool.end();
}

async function cmdDown() {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    if (applied.length === 0) {
        console.log('No migrations to roll back.');
        await pool.end();
        return;
    }

    const last = applied[applied.length - 1];
    const downFileName = `${last.version}_${last.name}_down.sql`;
    const downFilePath = path.join(MIGRATIONS_DIR, downFileName);

    // Also try without the name suffix
    const altDownFilePath = path.join(MIGRATIONS_DIR, `${last.version}_down.sql`);

    let downFile = downFilePath;
    if (!fs.existsSync(downFile)) {
        downFile = altDownFilePath;
    }

    if (!fs.existsSync(downFile)) {
        console.error(
            `❌ No rollback script found for ${last.version}_${last.name}. ` +
            `Expected: ${downFileName} or ${last.version}_down.sql`
        );
        await pool.end();
        process.exit(1);
    }

    const sql = fs.readFileSync(downFile, 'utf-8');
    console.log(`⬇️  Rolling back ${last.version}_${last.name}...`);

    try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
            `DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`,
            [last.version]
        );
        await pool.query('COMMIT');
        console.log(`   ✅ Rolled back ${last.version}_${last.name}.`);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ Rollback FAILED: ${err.message}`);
        await pool.end();
        process.exit(1);
    }

    await pool.end();
}

async function cmdStatus() {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));
    const files = getMigrationFiles();

    console.log('\n📋 Migration Status:\n');
    console.log('  Pending:');
    let hasPending = false;
    for (const file of files) {
        const version = parseVersion(file);
        const isApplied = appliedVersions.has(version);
        if (!isApplied) {
            console.log(`    ⬜ ${file}`);
            hasPending = true;
        }
    }
    if (!hasPending) console.log('    (none)');

    console.log('\n  Applied:');
    if (applied.length === 0) {
        console.log('    (none)');
    } else {
        for (const m of applied) {
            console.log(`    ✅ ${m.version}_${m.name} (applied ${m.applied_at})`);
        }
    }
    console.log('');

    await pool.end();
}

async function cmdCreate(name) {
    if (!name) {
        console.error('❌ Please provide a migration name.');
        console.log('   Usage: node migrate.js create <migration_name>');
        process.exit(1);
    }

    const files = getMigrationFiles();
    const lastVersion = files.length > 0 ? parseVersion(files[files.length - 1]) : '000';
    const nextVersion = String(parseInt(lastVersion, 10) + 1).padStart(3, '0');

    const filename = `${nextVersion}_${name}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    const template = `-- =============================================================================
-- Migration ${nextVersion}: ${name}
-- Description: TODO
-- =============================================================================

-- UP
-- Write your migration SQL here.

`;

    fs.writeFileSync(filepath, template, 'utf-8');
    console.log(`✅ Created migration: ${filename}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const command = process.argv[2] || 'up';

    switch (command) {
        case 'up':
            await cmdUp();
            break;
        case 'down':
            await cmdDown();
            break;
        case 'status':
            await cmdStatus();
            break;
        case 'create':
            await cmdCreate(process.argv[3]);
            break;
        default:
            console.log(`Unknown command: ${command}`);
            console.log('Usage: node migrate.js {up|down|status|create}');
            process.exit(1);
    }
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
