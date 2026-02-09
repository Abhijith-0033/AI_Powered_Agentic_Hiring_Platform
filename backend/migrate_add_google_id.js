import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 120000 // Extended timeout
});

async function migrate_1() {
    const client = await pool.connect();
    try {
        console.log('--- Migration Started ---');
        console.log('Adding google_id column to credentials table...');

        await client.query(`
            ALTER TABLE credentials 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
        `);

        console.log('✅ Migration Successful: google_id added.');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate_1();
