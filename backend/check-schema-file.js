import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings'
            ORDER BY column_name;
        `);
        const schema = res.rows.map(row => `${row.column_name}: ${row.data_type}`).join('\n');
        fs.writeFileSync('schema_job_postings.txt', schema);
        process.exit(0);
    } catch (err) {
        console.error('Database Error:', err);
        process.exit(1);
    }
}

checkSchema();
