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
const jobId = 5;
const newTestId = '615f3128-6a6f-42e3-bea4-7d8835754e07'; // Demo Test

(async () => {
    try {
        console.log(`Assigning new test ${newTestId} to candidate ${candidateId} for job ${jobId}...`);

        await pool.query(`
            UPDATE job_applications
            SET test_id = $1, test_status = 'pending'
            WHERE candidate_id = $2 AND job_id = $3
        `, [newTestId, candidateId, jobId]);

        console.log('✅ Application updated successfully.');

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
