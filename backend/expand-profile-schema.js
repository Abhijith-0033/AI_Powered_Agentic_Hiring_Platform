import pool from './config/db.js';

/**
 * Migration Script: Expand Job Seeker Profile
 * 
 * This script creates four new tables to support multiple entries:
 * 1. candidate_education
 * 2. candidate_experience
 * 3. candidate_achievements
 * 4. candidate_projects
 * 
 * It ensures referential integrity with the 'candidates' table.
 */
async function expandProfileSchema() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting profile expansion migration...\n');

        await client.query('BEGIN');

        // 1. candidate_education
        console.log('1️⃣  Creating candidate_education table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_education (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                institution VARCHAR(255) NOT NULL,
                degree VARCHAR(255) NOT NULL,
                field_of_study VARCHAR(255),
                start_date DATE,
                end_date DATE,
                grade_or_cgpa VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ candidate_education table created');

        // 2. candidate_experience
        console.log('2️⃣  Creating candidate_experience table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_experience (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                company_name VARCHAR(255) NOT NULL,
                job_title VARCHAR(255) NOT NULL,
                employment_type VARCHAR(100), -- Full-time, Part-time, etc.
                location VARCHAR(255),
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT false,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ candidate_experience table created');

        // 3. candidate_achievements
        console.log('3️⃣  Creating candidate_achievements table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_achievements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                issuer VARCHAR(255),
                date DATE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ candidate_achievements table created');

        // 4. candidate_projects
        console.log('4️⃣  Creating candidate_projects table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_projects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                project_title VARCHAR(255) NOT NULL,
                project_description TEXT,
                technologies_used TEXT[],
                project_link VARCHAR(500),
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('   ✅ candidate_projects table created');

        await client.query('COMMIT');
        console.log('\n✨ Profile expansion migration completed successfully!');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

expandProfileSchema();
