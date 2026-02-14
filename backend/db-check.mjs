import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import pool from './backend/config/db.js';

async function checkDb() {
    try {
        console.log('--- Checking interviews table schema ---');
        const schemaRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'interviews'
        `);
        console.table(schemaRes.rows);

        console.log('\n--- Checking recent interviews ---');
        const dataRes = await pool.query('SELECT id, application_id, channel_name, status FROM interviews ORDER BY created_at DESC LIMIT 5');
        console.table(dataRes.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDb();
