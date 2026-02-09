import pool from './config/db.js';

/**
 * Migration Script: Enhanced Job Application Schema
 * 
 * Creates tables for:
 * 1. job_application_profile_snapshot - Stores candidate profile at apply time
 * 2. job_expectations - Stores recruiter's expected requirements for jobs
 */
async function expandApplicationSchema() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting enhanced application schema migration...\n');

        await client.query('BEGIN');

        // Table 1: Profile Snapshot
        console.log('1️⃣  Creating job_application_profile_snapshot table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_application_profile_snapshot (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
                job_seeker_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                profile_snapshot JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ job_application_profile_snapshot table created');

        // Index for faster lookups
        console.log('   📊 Adding index on application_id...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_snapshot_application_id 
            ON job_application_profile_snapshot(application_id);
        `);

        // Table 2: Job Expectations
        console.log('2️⃣  Creating job_expectations table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_expectations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT NOT NULL UNIQUE REFERENCES job_postings(job_id) ON DELETE CASCADE,
                expected_experience_years INT,
                expected_education TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ job_expectations table created');

        // Index for job_id
        console.log('   📊 Adding index on job_id...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_expectations_job_id 
            ON job_expectations(job_id);
        `);

        await client.query('COMMIT');
        console.log('\n✨ Enhanced application schema migration completed successfully!');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

expandApplicationSchema();
