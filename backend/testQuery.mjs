import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const testId = '21a55959-276a-407d-9d1a-b311353eb257';
const candidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';

(async () => {
    try {
        // Check test status
        const testResult = await pool.query('SELECT id, title, status FROM tests WHERE id = $1', [testId]);
        console.log('Test Status:', testResult.rows[0]?.status);

        // Check application
        const appResult = await pool.query('SELECT test_id FROM job_applications WHERE candidate_id = $1 AND test_id = $1', [candidateId, testId]);
        console.log('Application has test?:', appResult.rows.length > 0);

        // Run the actual query
        const query = `
            SELECT t.id, t.title, t.status
            FROM job_applications ja
            JOIN tests t ON ja.test_id = t.id
            WHERE ja.candidate_id = $1 AND t.status = 'published'
        `;
        const result = await pool.query(query, [candidateId]);
        console.log('Query returned:', result.rows.length, 'rows');

        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        pool.end();
    }
})();
