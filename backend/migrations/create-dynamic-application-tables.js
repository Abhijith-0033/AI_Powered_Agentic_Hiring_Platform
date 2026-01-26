
import pool from '../config/db.js';

const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Job Requirements Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_requirements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT REFERENCES job_postings(job_id) ON DELETE CASCADE,
                requirement_text TEXT NOT NULL,
                is_mandatory BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT now()
            );
        `);
        console.log('✅ job_requirements table created');

        // 2. Job Questions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT REFERENCES job_postings(job_id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                question_type VARCHAR(30) CHECK (
                    question_type IN ('text','number','boolean','dropdown')
                ),
                options TEXT[],
                is_required BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT now()
            );
        `);
        console.log('✅ job_questions table created');

        // 3. Job Applications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id BIGINT REFERENCES job_postings(job_id),
                candidate_id UUID REFERENCES candidates(id),
                company_id UUID REFERENCES companies(id),
                resume_url TEXT NOT NULL,
                status VARCHAR(30) DEFAULT 'applied',
                applied_at TIMESTAMPTZ DEFAULT now(),
                UNIQUE (job_id, candidate_id)
            );
        `);
        console.log('✅ job_applications table created');

        // 4. Job Application Answers Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_application_answers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
                question_id UUID REFERENCES job_questions(id),
                answer TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            );
        `);
        console.log('✅ job_application_answers table created');

        await client.query('COMMIT');
        console.log('🚀 All new tables created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating tables:', error);
    } finally {
        client.release();
        process.exit();
    }
};

createTables();
