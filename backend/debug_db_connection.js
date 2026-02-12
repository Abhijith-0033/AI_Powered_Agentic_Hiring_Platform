import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first'); // Force Node to prefer IPv4

const config = {
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    // force ipv4
    host: 'ep-delicate-brook-ahp3lur6-pooler.c-3.us-east-1.aws.neon.tech',
    // port: 5432, 
    // database: 'neondb',
    // user: 'neondb_owner',
    // password: '...' // already in connectionString
};

console.log('--- Testing DB Connection ---');
console.log('Connecting to:', config.connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password

const pool = new Pool(config);

async function test() {
    try {
        const client = await pool.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0].now);
        client.release();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.error('Full Error:', err);
    } finally {
        await pool.end();
    }
}

test();
