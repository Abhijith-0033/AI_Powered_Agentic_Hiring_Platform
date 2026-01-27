
import pool from '../config/db.js';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Starting Migration: Education & Skills Requirements ---');

        await client.query('BEGIN');

        // 1. Add columns to job_postings
        console.log('Adding require_education and require_skills to job_postings...');
        await client.query(`
            ALTER TABLE job_postings 
            ADD COLUMN IF NOT EXISTS require_education BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS require_skills BOOLEAN DEFAULT false;
        `);

        // 2. Create job_application_education table
        console.log('Creating job_application_education table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_application_education (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
                degree VARCHAR(150),
                institution VARCHAR(200),
                graduation_year INTEGER,
                gpa NUMERIC(3,2)
            );
        `);

        // 3. Create job_application_skills table
        console.log('Creating job_application_skills table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_application_skills (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
                skill TEXT NOT NULL
            );
        `);

        await client.query('COMMIT');
        console.log('--- Migration Completed Successfully ---');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('--- Migration Failed ---');
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
