
import 'dotenv/config';
import pool from '../config/db.js';

const migrate = async () => {
    try {
        console.log('Adding required_education column to job_postings...');
        await pool.query(`
            ALTER TABLE job_postings 
            ADD COLUMN IF NOT EXISTS required_education TEXT DEFAULT NULL;
        `);
        console.log('Column added successfully.');

        // Verify
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings' 
            AND column_name = 'required_education';
        `);

        if (res.rows.length > 0) {
            console.log('Verification: Column exists.');
        } else {
            console.error('Verification failed: Column not found.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
};

migrate();
