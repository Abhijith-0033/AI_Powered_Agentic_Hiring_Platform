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
        console.log('Listing recent tests...');
        const result = await pool.query('SELECT id, title, status, job_id, created_at FROM tests ORDER BY created_at DESC LIMIT 5');
        console.log(`Found ${result.rows.length} recent tests:`);
        result.rows.forEach(t => {
            console.log(`- [${t.status}] ${t.title} (ID: ${t.id}, JobID: ${t.job_id}, Created: ${t.created_at})`);
        });

        const candidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';
        const apps = await pool.query('SELECT job_id, test_id FROM job_applications WHERE candidate_id = $1', [candidateId]);
        console.log(`\nCandidate Applications (${apps.rows.length}):`);
        apps.rows.forEach(a => {
            console.log(`- Job ${a.job_id}: Test ${a.test_id}`);
        });

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
