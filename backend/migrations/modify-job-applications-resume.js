import pool from '../config/db.js';

const modifyApplicationsTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🔄 Modifying job_applications table...');

        // Drop the existing resume_url column and add new columns
        await client.query(`
            ALTER TABLE job_applications
            DROP COLUMN IF EXISTS resume_url;
        `);

        await client.query(`
            ALTER TABLE job_applications
            ADD COLUMN resume_id UUID REFERENCES candidate_resumes(id),
            ADD COLUMN resume_name TEXT NOT NULL,
            ADD COLUMN resume_data TEXT NOT NULL;
        `);

        console.log('✅ Added resume_id, resume_name, and resume_data columns');

        await client.query('COMMIT');
        console.log('🚀 job_applications table modified successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error modifying table:', error);
    } finally {
        client.release();
        process.exit();
    }
};

modifyApplicationsTable();
