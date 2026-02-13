const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) {
        const val = v.join('=').trim();
        env[k.trim()] = val.replace(/^['"]|['"]$/g, '');
    }
});

const pool = new Pool({
    connectionString: env.NEON_DATABASE_URL || env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const candidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';

(async () => {
    try {
        // New Query Logic
        const query = `
            SELECT t.id, t.title, t.description, t.instructions,
                   TO_CHAR(t.start_date, 'YYYY-MM-DD') as start_date, t.start_time,
                   TO_CHAR(t.end_date, 'YYYY-MM-DD') as end_date, t.end_time,
                   t.duration_minutes, t.status as test_status, t.results_published,
                   jp.job_title, comp.name as company_name,
                   ja.id as application_id, 
                   COALESCE(ta.status, 'pending') as my_test_status,
                   ta.id as attempt_id, ta.status as attempt_status,
                   ta.total_score, ta.max_score, ta.submitted_at
            FROM job_applications ja
            JOIN tests t ON ja.job_id = t.job_id
            JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN test_attempts ta ON t.id = ta.test_id AND ta.candidate_id = $1
            WHERE ja.candidate_id = $1 AND t.status = 'published'
            ORDER BY t.start_date ASC, t.start_time ASC
        `;
        const result = await pool.query(query, [candidateId]);

        const testTest = result.rows.find(r => r.id === '1960f150-545c-4c19-87de-e198918c9b19');
        if (testTest) {
            console.log('--- Test Test Details ---');
            console.log(JSON.stringify(testTest, null, 2));

            // Check categorization
            const now = new Date();
            const startDateTime = new Date(`${testTest.start_date}T${testTest.start_time}`);
            const endDateTime = new Date(`${testTest.end_date}T${testTest.end_time}`);

            console.log('Now:', now);
            console.log('Start:', startDateTime);
            console.log('End:', endDateTime);

            if (testTest.attempt_status === 'submitted' || testTest.attempt_status === 'evaluated') {
                console.log('Categorization: COMPLETED');
            } else if (now < startDateTime) {
                console.log('Categorization: UPCOMING');
            } else if (now >= startDateTime && now <= endDateTime) {
                console.log('Categorization: ONGOING');
            } else {
                console.log('Categorization: EXPIRED (Completed)');
            }
        } else {
            console.log('Test Test NOT found in query result!');
        }

        console.log('Query Rows:', result.rows.length);

        const now = new Date();
        const upcoming = [];
        const ongoing = [];
        const completed = [];

        for (const test of result.rows) {
            const startDateTime = new Date(`${test.start_date}T${test.start_time}`);
            const endDateTime = new Date(`${test.end_date}T${test.end_time}`);

            if (test.attempt_status === 'submitted' || test.attempt_status === 'evaluated') {
                completed.push(test);
            } else if (now < startDateTime) {
                upcoming.push(test);
            } else if (now >= startDateTime && now <= endDateTime) {
                ongoing.push(test);
            } else {
                completed.push({ ...test, expired: true });
            }
        }

        console.log('Response Structure:');
        console.log(JSON.stringify({ success: true, data: { upcoming, ongoing, completed } }, null, 2));

        pool.end();
    } catch (error) {
        console.error(error);
        pool.end();
    }
})();
