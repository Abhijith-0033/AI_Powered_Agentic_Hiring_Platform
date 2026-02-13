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
        // Check applications with tests for this candidate
        const apps = await pool.query(`
            SELECT ja.id, ja.job_id, ja.test_id, ja.status,
                   t.title, t.status as test_status
            FROM job_applications ja
            LEFT JOIN tests t ON ja.test_id = t.id
            WHERE ja.candidate_id = $1 AND ja.test_id IS NOT NULL
        `, [candidateId]);

        console.log('Applications with tests for candidate:', apps.rows.length);
        apps.rows.forEach(app => {
            console.log(`\nApplication ID: ${app.id}`);
            console.log(`  Job ID: ${app.job_id}`);
            console.log(`  Test ID: ${app.test_id}`);
            console.log(`  Test Title: ${app.title || 'N/A'}`);
            console.log(`  Test Status: "${app.test_status}" (type: ${typeof app.test_status})`);
            console.log(`  App Status: ${app.status}`);
        });

        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        pool.end();
    }
})();
