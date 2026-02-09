import pool from './config/db.js';

/**
 * Migration Script: Profile Image Table
 * 
 * Creates a dedicated table for storing job seeker profile images.
 * Uses BYTEA for efficient binary storage (matching resume storage pattern).
 */
async function expandProfileImageSchema() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting profile image migration...\n');

        await client.query('BEGIN');

        console.log('1️⃣  Creating job_seeker_profile_image table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_seeker_profile_image (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_seeker_id UUID NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
                image_data BYTEA NOT NULL,
                image_type VARCHAR(50) NOT NULL, -- e.g., 'image/png'
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ job_seeker_profile_image table created');

        await client.query('COMMIT');
        console.log('\n✨ Profile image migration completed successfully!');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

expandProfileImageSchema();
