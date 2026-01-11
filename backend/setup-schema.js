import pool from './config/db.js';

async function setupSchema() {
    try {
        console.log('🔄 Setting up database schema...');


        // 1. Candidates Table
        console.log('🔹 Processing candidates table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Add columns individually
        const columns = [
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS location VARCHAR(150)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS github_url TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_description TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT[]',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_url TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years INTEGER',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ];

        for (const query of columns) {
            try {
                await pool.query(query);
            } catch (e) {
                console.log(`⚠️  Warning running ${query}: ${e.message}`);
            }
        }
        console.log('✅ Candidates table checked/updated');

        // 2. Candidate Experience
        console.log('🔹 Processing candidate_experience table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_experience (
                id BIGSERIAL PRIMARY KEY,
                candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
                job_title VARCHAR(150),
                company_name VARCHAR(150),
                location VARCHAR(150),
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                description TEXT
            );
        `);
        console.log('✅ Candidate Experience table checked/created');

        // 3. Candidate Education
        console.log('🔹 Processing candidate_education table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_education (
                id BIGSERIAL PRIMARY KEY,
                candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
                degree VARCHAR(150),
                institution VARCHAR(200),
                graduation_year INTEGER,
                gpa NUMERIC(3,2)
            );
        `);
        console.log('✅ Candidate Education table checked/created');

        console.log('🎉 Schema setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema setup failed:', error);
        process.exit(1);
    }
}

setupSchema();
