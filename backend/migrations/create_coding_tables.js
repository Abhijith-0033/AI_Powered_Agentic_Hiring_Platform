import pool from '../config/db.js';

/**
 * Migration: Create tables for Coding Test Module
 * Tables: coding_tests, coding_questions, test_cases, coding_submissions
 * Date: 2026-02-13
 * 
 * This is separate from the existing quiz-style test module
 * Routes: /api/coding/* (vs existing /api/tests/*)
 */
async function createCodingTables() {
    const client = await pool.connect();
    try {
        console.log('🔄 Creating coding test module tables...');

        await client.query('BEGIN');

        // 1. Create coding_tests table
        console.log('📝 Creating coding_tests table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS coding_tests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT,
                recruiter_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                time_limit INTEGER NOT NULL DEFAULT 60,
                total_marks INTEGER NOT NULL DEFAULT 100,
                status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
                results_published BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (job_id) REFERENCES job_postings(job_id) ON DELETE SET NULL
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_tests_job_id ON coding_tests(job_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_tests_recruiter_id ON coding_tests(recruiter_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_tests_status ON coding_tests(status)');
        console.log('✅ coding_tests table created');

        // 2. Create coding_questions table
        console.log('📝 Creating coding_questions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS coding_questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                test_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                problem_statement TEXT NOT NULL,
                input_format TEXT,
                output_format TEXT,
                constraints TEXT,
                marks INTEGER NOT NULL DEFAULT 10,
                question_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (test_id) REFERENCES coding_tests(id) ON DELETE CASCADE
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_questions_test_id ON coding_questions(test_id)');
        console.log('✅ coding_questions table created');

        // 3. Create test_cases table
        console.log('📝 Creating test_cases table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_cases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                question_id UUID NOT NULL,
                input TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                is_hidden BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_test_cases_question_id ON test_cases(question_id)');
        console.log('✅ test_cases table created');

        // 4. Create coding_submissions table
        console.log('📝 Creating coding_submissions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS coding_submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID NOT NULL,
                question_id UUID NOT NULL,
                test_id UUID NOT NULL,
                source_code TEXT NOT NULL,
                language VARCHAR(50) NOT NULL,
                score DECIMAL(5,2) DEFAULT 0,
                max_score INTEGER NOT NULL,
                test_cases_passed INTEGER DEFAULT 0,
                total_test_cases INTEGER NOT NULL,
                execution_time INTEGER,
                memory_used INTEGER,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'evaluated', 'error')),
                error_message TEXT,
                is_published BOOLEAN DEFAULT false,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE,
                FOREIGN KEY (test_id) REFERENCES coding_tests(id) ON DELETE CASCADE,
                UNIQUE(candidate_id, question_id)
            );
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_submissions_candidate_id ON coding_submissions(candidate_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_submissions_test_id ON coding_submissions(test_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_coding_submissions_question_id ON coding_submissions(question_id)');
        console.log('✅ coding_submissions table created');

        await client.query('COMMIT');
        console.log('🎉 Coding test module migration completed successfully!');
        console.log('');
        console.log('Tables created:');
        console.log('  - coding_tests');
        console.log('  - coding_questions');
        console.log('  - test_cases');
        console.log('  - coding_submissions');
        console.log('');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

createCodingTables();
