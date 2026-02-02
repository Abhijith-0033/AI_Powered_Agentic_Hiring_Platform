import pool from './config/db.js';

async function migrate() {
    console.log('Starting migration...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add match_score column
        console.log('Adding match_score column...');
        await client.query(`
            ALTER TABLE job_applications 
            ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT NULL
        `);

        // Add shortlisted_by_ai column
        console.log('Adding shortlisted_by_ai column...');
        await client.query(`
            ALTER TABLE job_applications 
            ADD COLUMN IF NOT EXISTS shortlisted_by_ai BOOLEAN DEFAULT false
        `);

        // Add index
        console.log('Adding index...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_applications_match_score 
            ON job_applications(job_id, match_score DESC) 
            WHERE match_score IS NOT NULL
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
