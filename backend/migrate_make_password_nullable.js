import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 120000
});

async function migrate_password_nullable() {
    const client = await pool.connect();
    try {
        console.log('--- Migration Started ---');
        console.log('Altering credentials table: Making password_hash nullable...');

        await client.query(`
            ALTER TABLE credentials 
            ALTER COLUMN password_hash DROP NOT NULL;
        `);

        console.log('✅ Migration Successful: password_hash is now nullable.');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate_password_nullable();
