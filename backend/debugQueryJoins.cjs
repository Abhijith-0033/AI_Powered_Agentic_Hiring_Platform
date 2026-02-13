
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually read .env
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        let val = value;
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[key] = val;
    }
});

const databaseUrl = env.NEON_DATABASE_URL || env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    const client = await pool.connect();
    try {
        console.log('--- CANDIDATE TEST QUERY DEBUG ---');

        // Target candidate ID from previous debug output
        const targetCandidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';

        console.log(`Checking tests for Candidate ID: ${targetCandidateId}`);

        // Try the query step by step to see where it fails
        const jaTest = await client.query('SELECT test_id, job_id FROM job_applications WHERE candidate_id = $1', [targetCandidateId]);
        console.log(`Job Applications for candidate: ${jaTest.rows.length}`);
        jaTest.rows.forEach(r => console.log(` - Job ID: ${r.job_id}, Test ID: ${r.test_id}`));

        if (jaTest.rows.length > 0) {
            const testId = jaTest.rows[0].test_id;
            const jobId = jaTest.rows[0].job_id;

            const testResult = await client.query('SELECT status FROM tests WHERE id = $1', [testId]);
            console.log(`Test Status: ${testResult.rows[0]?.status}`);

            const jpResult = await client.query('SELECT company_id FROM job_postings WHERE job_id = $1', [jobId]);
            console.log(`Job Posting Company ID: ${jpResult.rows[0]?.company_id}`);

            if (jpResult.rows[0]?.company_id) {
                const compResult = await client.query('SELECT name FROM companies WHERE id = $1', [jpResult.rows[0].company_id]);
                console.log(`Company Name: ${compResult.rows[0]?.name}`);
            } else {
                console.log('MISSING COMPANY ID! Join on companies table will fail.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        pool.end();
    }
})();
