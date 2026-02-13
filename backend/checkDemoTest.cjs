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
const newTestId = '615f3128-6a6f-42e3-bea4-7d8835754e07'; // "Demo" test

(async () => {
    try {
        console.log(`Checking assignment for candidate ${candidateId}...`);

        const res = await pool.query(`
            SELECT ja.id, ja.test_id, t.title, ja.test_status
            FROM job_applications ja
            LEFT JOIN tests t ON ja.test_id = t.id
            WHERE ja.candidate_id = $1 AND ja.job_id = 5
        `, [candidateId]);

        if (res.rows.length === 0) {
            console.log('No application found for Job 5');
        } else {
            const app = res.rows[0];
            console.log('Current Assignment:');
            console.log(`- Test ID: ${app.test_id}`);
            console.log(`- Title: ${app.title}`);
            console.log(`- Status: ${app.test_status}`);

            if (app.test_id === newTestId) {
                console.log('✅ Correctly assigned to new test');
            } else {
                console.log('❌ NOT assigned to new test');
            }
        }

        console.log('\nChecking "Demo" test details:');
        const testRes = await pool.query('SELECT id, status, start_date, start_time FROM tests WHERE id = $1', [newTestId]);
        if (testRes.rows.length > 0) {
            console.log(JSON.stringify(testRes.rows[0], null, 2));
        } else {
            console.log('Test not found in DB');
        }

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
