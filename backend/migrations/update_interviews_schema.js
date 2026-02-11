import pool from '../config/db.js';

/**
 * Migration: Update interviews table for Interview Management Module
 * Purpose: Add new columns for video interviews, email tracking, and recruiter assignment
 * Date: 2026-02-11
 */
async function updateInterviewsSchema() {
    const client = await pool.connect();
    try {
        console.log('🔄 Updating interviews table schema...');

        await client.query('BEGIN');

        // 1. Add recruiter_id column (if not exists)
        console.log('📝 Adding recruiter_id column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS recruiter_id UUID
        `);

        // 2. Add channel_name column (unique identifier for Agora)
        console.log('📝 Adding channel_name column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS channel_name TEXT UNIQUE
        `);

        // 3. Add scheduled_at column (combined date/time)
        console.log('📝 Adding scheduled_at column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE
        `);

        // 4. Update meeting_link column (make it TEXT if not already)
        console.log('📝 Ensuring meeting_link is TEXT...');
        await client.query(`
            ALTER TABLE interviews 
            ALTER COLUMN meeting_link TYPE TEXT
        `);

        // 5. Add email_sent column
        console.log('📝 Adding email_sent column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false
        `);

        // 6. Update status enum to include 'pending'
        console.log('📝 Updating status column CHECK constraint...');
        await client.query(`
            ALTER TABLE interviews 
            DROP CONSTRAINT IF EXISTS interviews_status_check
        `);
        await client.query(`
            ALTER TABLE interviews 
            ADD CONSTRAINT interviews_status_check 
            CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'))
        `);

        // 7. Create indexes for performance
        console.log('📊 Creating performance indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_id 
            ON interviews(recruiter_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_channel_name 
            ON interviews(channel_name)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at 
            ON interviews(scheduled_at)
        `);

        // 8. Update existing rows: populate scheduled_at from interview_date + start_time
        console.log('🔄 Populating scheduled_at for existing records...');
        await client.query(`
            UPDATE interviews 
            SET scheduled_at = (interview_date + start_time)::TIMESTAMP WITH TIME ZONE
            WHERE scheduled_at IS NULL AND interview_date IS NOT NULL AND start_time IS NOT NULL
        `);

        await client.query('COMMIT');
        console.log('✅ Interviews table schema updated successfully!');

        // Display summary
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'interviews'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Updated Schema:');
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

updateInterviewsSchema();
