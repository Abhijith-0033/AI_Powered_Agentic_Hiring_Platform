import pool from '../config/db.js';

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');
        await client.query('BEGIN');

        // 1. Add new columns
        await client.query(`
            ALTER TABLE job_postings 
            ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'internal',
            ADD COLUMN IF NOT EXISTS source_name VARCHAR(50) DEFAULT 'system',
            ADD COLUMN IF NOT EXISTS external_job_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS source_url TEXT,
            ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS external_company_name VARCHAR(255);
        `);

        // 2. Relax constraints on internal fields
        await client.query(`
            ALTER TABLE job_postings 
            ALTER COLUMN department DROP NOT NULL,
            ALTER COLUMN job_type DROP NOT NULL,
            ALTER COLUMN experience_level DROP NOT NULL,
            ALTER COLUMN required_skills DROP NOT NULL,
            ALTER COLUMN company_id DROP NOT NULL;
        `);

        // 3. Add unique constraint for external jobs
        // We use a partial index or unique constraint. 
        // A unique index is safer for 'upsert' operations in Postgres using ON CONFLICT
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_external_jobs_unique 
            ON job_postings (external_job_id, source_name) 
            WHERE source = 'external';
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit(); // Ensure script exits
    }
};

migrate();
