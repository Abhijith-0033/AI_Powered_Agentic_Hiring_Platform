import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const email = 'noname@gmail.com';

(async () => {
    try {
        console.log('=== CHECKING USER AND TEST ASSIGNMENT ===\n');

        // 1. Find user_id
        const userResult = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            console.log('ERROR: No user found with email:', email);
            pool.end();
            return;
        }

        const userId = userResult.rows[0].id;
        console.log('User ID:', userId);
        console.log('Role:', userResult.rows[0].role);

        // 2. Find candidate_id
        const candidateResult = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateResult.rows.length === 0) {
            console.log('ERROR: No candidate record found for this user');
            pool.end();
            return;
        }

        const candidateId = candidateResult.rows[0].id;
        console.log('Candidate ID:', candidateId);

        // 3. Check job applications with tests
        const appsResult = await pool.query(
            'SELECT id, job_id, test_id, status FROM job_applications WHERE candidate_id = $1',
            [candidateId]
        );
        console.log('\nApplications:', appsResult.rows.length);
        appsResult.rows.forEach(app => {
            console.log(`  - Job ID: ${app.job_id}, Test ID: ${app.test_id || 'NONE'}, Status: ${app.status}`);
        });

        // 4. Run the my-tests query
        console.log('\n=== RUNNING MY-TESTS QUERY ===\n');
        const myTestsQuery = `
            SELECT t.id, t.title, t.status,
                   TO_CHAR(t.start_date, 'YYYY-MM-DD') as start_date, t.start_time,
                   TO_CHAR(t.end_date, 'YYYY-MM-DD') as end_date, t.end_time
            FROM job_applications ja
            JOIN tests t ON ja.test_id = t.id
            JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            WHERE ja.candidate_id = $1 AND t.status = 'published'
            ORDER BY t.start_date ASC, t.start_time ASC
        `;

        const testsResult = await pool.query(myTestsQuery, [candidateId]);
        console.log('Tests returned:', testsResult.rows.length);

        if (testsResult.rows.length > 0) {
            testsResult.rows.forEach(test => {
                console.log(`\nTest: ${test.title}`);
                console.log(`  ID: ${test.id}`);
                console.log(`  Status: ${test.status}`);
                console.log(`  Start: ${test.start_date} ${test.start_time}`);
                console.log(`  End: ${test.end_date} ${test.end_time}`);
            });
        } else {
            console.log('NO TESTS FOUND!');

            // Debug why
            if (appsResult.rows.some(a => a.test_id)) {
                console.log('\nDEBUG: Application has test_id but query returned nothing.');
                console.log('Checking test status...');

                const testIds = appsResult.rows.filter(a => a.test_id).map(a => a.test_id);
                const testCheck = await pool.query(
                    'SELECT id, status FROM tests WHERE id = ANY($1::uuid[])',
                    [testIds]
                );

                testCheck.rows.forEach(t => {
                    console.log(`  Test ${t.id}: status = "${t.status}"`);
                });
            }
        }

        pool.end();
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error.stack);
        pool.end();
    }
})();
