import pool from '../config/db.js';

/**
 * Migration: Create tables for Test Module
 * Tables: tests, test_questions, test_attempts, test_answers
 * Also adds test-related columns to job_applications
 * Date: 2026-02-12
 */
async function createTestsTables() {
    const client = await pool.connect();
    try {
        console.log('🔄 Creating test module tables...');

        await client.query('BEGIN');

        // 1. Create tests table
        console.log('📝 Creating tests table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT,
                recruiter_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructions TEXT,
                start_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_date DATE NOT NULL,
                end_time TIME NOT NULL,
                duration_minutes INTEGER NOT NULL DEFAULT 60,
                status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
                results_published BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (job_id) REFERENCES job_postings(job_id) ON DELETE SET NULL
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_tests_job_id ON tests(job_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tests_recruiter_id ON tests(recruiter_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status)');
        console.log('✅ tests table created');

        // 2. Create test_questions table
        console.log('📝 Creating test_questions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                test_id UUID NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('objective', 'descriptive')),
                options JSONB,
                expected_answer TEXT NOT NULL,
                question_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id)');
        console.log('✅ test_questions table created');

        // 3. Create test_attempts table
        console.log('📝 Creating test_attempts table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_attempts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                test_id UUID NOT NULL,
                candidate_id UUID NOT NULL,
                application_id UUID NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                submitted_at TIMESTAMP WITH TIME ZONE,
                auto_submitted BOOLEAN DEFAULT false,
                time_taken_seconds INTEGER,
                total_score DECIMAL(5,2),
                max_score DECIMAL(5,2),
                status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated')),
                violation_count INTEGER DEFAULT 0,
                last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE SET NULL,
                FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE SET NULL,
                UNIQUE(test_id, candidate_id)
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_test_attempts_candidate_id ON test_attempts(candidate_id)');
        console.log('✅ test_attempts table created');

        // 4. Create test_answers table
        console.log('📝 Creating test_answers table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_answers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                attempt_id UUID NOT NULL,
                question_id UUID NOT NULL,
                candidate_answer TEXT,
                is_correct BOOLEAN,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_test_answers_attempt_id ON test_answers(attempt_id)');
        console.log('✅ test_answers table created');

        // 5. Add test-related columns to job_applications
        console.log('📝 Adding test columns to job_applications...');
        await client.query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS test_id UUID`);
        await client.query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS test_score DECIMAL(5,2)`);
        await client.query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'not_assigned'`);
        await client.query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS test_attempted_at TIMESTAMP WITH TIME ZONE`);
        console.log('✅ job_applications updated with test columns');

        await client.query('COMMIT');
        console.log('🎉 Test module migration completed successfully!');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

createTestsTables();
