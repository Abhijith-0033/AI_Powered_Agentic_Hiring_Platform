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

const testId = '1960f150-545c-4c19-87de-e198918c9b19';
const jobId = 5;

(async () => {
    try {
        console.log(`Simulating publish logic for test ${testId} (Job ${jobId})...`);

        // Check how many candidates WOULD be updated
        const checkRes = await pool.query(`
            SELECT id, candidate_id, test_id, test_status 
            FROM job_applications 
            WHERE job_id = $1 AND (test_id IS NULL OR test_status = 'pending')
        `, [jobId]);

        console.log(`Found ${checkRes.rows.length} candidates eligible for update:`);
        checkRes.rows.forEach(r => {
            console.log(`- App ID: ${r.id}, Cur Test: ${r.test_id}, Status: ${r.test_status}`);
        });

        if (checkRes.rows.length > 0) {
            console.log('Running UPDATE...');
            const updateRes = await pool.query(`
                UPDATE job_applications 
                SET test_id = $1, test_status = 'pending'
                WHERE job_id = $2 AND (test_id IS NULL OR test_status = 'pending')
            `, [testId, jobId]);
            console.log(`Updated ${updateRes.rowCount} rows.`);
        } else {
            console.log('No rows to update.');
        }

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
