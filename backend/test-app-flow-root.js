import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Fix env path
dotenv.config({ path: 'backend/.env' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
    console.error('No DB URL found. Make sure backend/.env exists and has NEON_DATABASE_URL');
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function testApplicationFlow() {
    try {
        console.log('=== TESTING APPLICATION FLOW ===\n');

        // 1. List all users (limit to 5)
        console.log('1. JOB SEEKERS:');
        const users = await pool.query("SELECT id, email, name, role FROM credentials WHERE role = 'job_seeker' LIMIT 5");
        users.rows.forEach(u => console.log(`   [${u.role}] ${u.email} (user_id: ${u.id})`));

        if (users.rows.length === 0) {
            console.log('   No job seekers found.');
            return;
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        pool.end();
    }
}
testApplicationFlow();
