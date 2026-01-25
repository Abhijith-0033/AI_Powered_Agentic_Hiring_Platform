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
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS location VARCHAR(150)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS github_url TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_description TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT[]',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_url TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_pdf TEXT',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_fresher BOOLEAN DEFAULT true',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS degree VARCHAR(150)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS institution VARCHAR(200)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS graduation_year INTEGER',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS gpa NUMERIC(4,2)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_title VARCHAR(150)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS company_name VARCHAR(150)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_location VARCHAR(150)',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS exp_start_date DATE',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS exp_end_date DATE',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false',
            'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_description TEXT',
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

        // Note: candidate_experience and candidate_education tables removed.
        // All education and experience data is now stored directly in the candidates table.

        console.log('🎉 Schema setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema setup failed:', error);
        process.exit(1);
    }
}

setupSchema();
