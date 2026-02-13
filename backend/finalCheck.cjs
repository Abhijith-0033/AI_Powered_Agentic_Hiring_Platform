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

(async () => {
    try {
        console.log('=== CHECKING CANDIDATE FOR noname@gmail.com ===\n');

        // Find in credentials table
        const credResult = await pool.query(`
            SELECT user_id, email, role
            FROM credentials
            WHERE email = $1
        `, ['noname@gmail.com']);

        if (credResult.rows.length === 0) {
            console.log('ERROR: No credentials found for noname@gmail.com');
            pool.end();
            return;
        }

        const cred = credResult.rows[0];
        console.log('Credentials found:');
        console.log('  Email:', cred.email);
        console.log('  Role:', cred.role);
        console.log('  User ID:', cred.user_id);

        // Find candidate
        const candResult = await pool.query(`
            SELECT id
            FROM candidates
            WHERE user_id = $1
        `, [cred.user_id]);

        if (candResult.rows.length === 0) {
            console.log('\nERROR: No candidate record for this user_id');
            pool.end();
            return;
        }

        const candidateId = candResult.rows[0].id;
        console.log('  Candidate ID:', candidateId);

        // Check applications
        const appsResult = await pool.query(`
            SELECT id, job_id, test_id, status
            FROM job_applications
            WHERE candidate_id = $1
        `, [candidateId]);

        console.log('\nApplications:', appsResult.rows.length);
        appsResult.rows.forEach(app => {
            console.log(`  Job ${app.job_id}: test_id=${app.test_id || 'NULL'}, status=${app.status}`);
        });

        // Run the my-tests query with LEFT JOIN
        console.log('\n=== RUNNING MY-TESTS QUERY ===\n');
        const testsResult = await pool.query(`
            SELECT t.id, t.title, t.status,
                   TO_CHAR(t.start_date, 'YYYY-MM-DD') as start_date, t.start_time
            FROM job_applications ja
            JOIN tests t ON ja.test_id = t.id
            JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            WHERE ja.candidate_id = $1 AND t.status = 'published'
        `, [candidateId]);

        console.log('Tests found:', testsResult.rows.length);
        if (testsResult.rows.length > 0) {
            testsResult.rows.forEach(test => {
                console.log(`\n  Test: ${test.title}`);
                console.log(`    ID: ${test.id}`);
                console.log(`    Status: ${test.status}`);
                console.log(`    Start: ${test.start_date} ${test.start_time}`);
            });
        } else {
            console.log('NO TESTS FOUND!');
        }

        pool.end();
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error.stack);
        pool.end();
    }
})();
