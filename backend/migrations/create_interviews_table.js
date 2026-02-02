import pool from '../config/db.js';

/**
 * Migration: Create interviews and notifications tables
 * Purpose: Support Interview Scheduler AI Tool
 * Date: 2026-02-02
 */
async function createInterviewsTables() {
    const client = await pool.connect();
    try {
        console.log('🔄 Creating interviews and notifications tables...');

        await client.query('BEGIN');

        // 1. Create interviews table
        console.log('📅 Creating interviews table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS interviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT NOT NULL,
                application_id UUID NOT NULL,
                candidate_id UUID NOT NULL,
                interview_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                mode VARCHAR(20) NOT NULL CHECK (mode IN ('online', 'offline')),
                meeting_link TEXT,
                status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (job_id) REFERENCES job_postings(job_id) ON DELETE CASCADE,
                FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            );
        `);

        // Add index for faster queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
        `);

        console.log('✅ Interviews table created');

        // 2. Create notifications table
        console.log('🔔 Creating notifications table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                type VARCHAR(50) NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT false,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES candidates(user_id) ON DELETE CASCADE
            );
        `);

        // Add index for faster queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
        `);

        console.log('✅ Notifications table created');

        await client.query('COMMIT');
        console.log('🎉 Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

createInterviewsTables();
