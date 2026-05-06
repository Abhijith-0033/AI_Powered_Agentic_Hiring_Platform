import 'dotenv/config';
import pool from '../config/db.js';

/**
 * Migration: Fix interviews table schema for production
 * Purpose: Ensure all optional columns are nullable and status constraint includes 'pending'
 * Run this on production (Render) to fix the 500 error on /create-and-schedule
 */
async function fixInterviewsSchema() {
    const client = await pool.connect();
    try {
        console.log('🔄 Fixing interviews table schema for production...');
        await client.query('BEGIN');

        // 1. Make all scheduling columns nullable (safe to run multiple times)
        console.log('📝 Making scheduling columns nullable...');
        await client.query(`
            ALTER TABLE interviews 
            ALTER COLUMN interview_date DROP NOT NULL,
            ALTER COLUMN start_time DROP NOT NULL,
            ALTER COLUMN end_time DROP NOT NULL
        `);

        // 2. Make mode nullable (it was NOT NULL in original schema)
        console.log('📝 Making mode column nullable...');
        await client.query(`ALTER TABLE interviews ALTER COLUMN mode DROP NOT NULL`);

        // 3. Make created_by nullable
        console.log('📝 Making created_by column nullable...');
        await client.query(`ALTER TABLE interviews ALTER COLUMN created_by DROP NOT NULL`);

        // 4. Add recruiter_id if missing
        console.log('📝 Ensuring recruiter_id column exists...');
        await client.query(`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS recruiter_id UUID`);

        // 5. Add channel_name if missing
        console.log('📝 Ensuring channel_name column exists...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS channel_name TEXT
        `);

        // 6. Try to add UNIQUE constraint on channel_name (ignore if already exists)
        try {
            await client.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_interviews_channel_name_unique 
                ON interviews(channel_name) WHERE channel_name IS NOT NULL
            `);
        } catch (e) {
            console.log('  (channel_name unique index already exists or skipped)');
        }

        // 7. Add scheduled_at if missing
        console.log('📝 Ensuring scheduled_at column exists...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE
        `);

        // 8. Add email_sent if missing
        console.log('📝 Ensuring email_sent column exists...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false
        `);

        // 9. Update status CHECK constraint to include 'pending'
        console.log('📝 Updating status CHECK constraint...');
        await client.query(`ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_status_check`);
        await client.query(`
            ALTER TABLE interviews 
            ADD CONSTRAINT interviews_status_check 
            CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'))
        `);

        // 10. Update default status to 'pending'
        console.log('📝 Setting default status to pending...');
        await client.query(`ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'pending'`);

        await client.query('COMMIT');
        console.log('✅ Interviews table schema fixed successfully!');

        // Show updated schema
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'interviews'
            ORDER BY ordinal_position
        `);
        console.log('\n📋 Current Schema:');
        console.table(result.rows);

        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

fixInterviewsSchema();
