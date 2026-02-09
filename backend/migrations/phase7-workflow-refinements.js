/**
 * Phase 7 Migration: Add expected_answer, job status, and experience_level
 * 
 * This migration adds:
 * 1. expected_answer column to job_questions (recruiter-only field)
 * 2. status column to job_postings (open/closed/deleted)
 * 3. experience_level column to job_postings (standardized dropdown)
 * 
 * Run: node backend/migrations/phase7-workflow-refinements.js
 */

import pool from '../config/db.js';

const runMigration = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log('🚀 Starting Phase 7 migration...\n');

        // 1. Add expected_answer to job_questions
        console.log('1️⃣ Adding expected_answer column to job_questions...');
        await client.query(`
            ALTER TABLE job_questions
            ADD COLUMN IF NOT EXISTS expected_answer TEXT;
        `);
        console.log('✅ expected_answer column added\n');

        // 2. Add status column to job_postings
        console.log('2️⃣ Adding status column to job_postings...');

        // First check if column exists
        const statusCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'job_postings' AND column_name = 'status'
        `);

        if (statusCheck.rows.length === 0) {
            await client.query(`
                ALTER TABLE job_postings
                ADD COLUMN status VARCHAR(20) DEFAULT 'open';
            `);

            // Add CHECK constraint separately for easier debugging
            await client.query(`
                ALTER TABLE job_postings
                ADD CONSTRAINT check_job_status CHECK (status IN ('open', 'closed', 'deleted'));
            `);

            // Create index for faster filtering
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
            `);

            console.log('✅ status column added with CHECK constraint and index\n');
        } else {
            console.log('ℹ️ status column already exists, skipping\n');
        }

        // 3. Add experience_level column to job_postings
        console.log('3️⃣ Adding experience_level column to job_postings...');

        const expLevelCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'job_postings' AND column_name = 'experience_level'
        `);

        if (expLevelCheck.rows.length === 0) {
            await client.query(`
                ALTER TABLE job_postings
                ADD COLUMN experience_level VARCHAR(20);
            `);

            await client.query(`
                ALTER TABLE job_postings
                ADD CONSTRAINT check_experience_level CHECK (
                    experience_level IS NULL OR 
                    experience_level IN ('Fresher', 'Junior', 'Mid', 'Senior', 'Lead')
                );
            `);

            console.log('✅ experience_level column added with CHECK constraint\n');
        } else {
            console.log('ℹ️ experience_level column already exists, skipping\n');
        }

        // 4. Set existing jobs to 'open' status if null
        console.log('4️⃣ Setting existing jobs to open status...');
        const updateResult = await client.query(`
            UPDATE job_postings SET status = 'open' WHERE status IS NULL
        `);
        console.log(`✅ Updated ${updateResult.rowCount} jobs to 'open' status\n`);

        await client.query('COMMIT');
        console.log('🎉 Phase 7 migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error(error);
    } finally {
        client.release();
        process.exit();
    }
};

runMigration();
