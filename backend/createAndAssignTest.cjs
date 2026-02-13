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
        const jobId = 5;

        // 1. Get company ID from job
        console.log(`Fetching job ${jobId}...`);
        const jobRes = await pool.query('SELECT company_id FROM job_postings WHERE job_id = $1', [jobId]);
        if (jobRes.rows.length === 0) {
            console.log('Error: Job ID 5 not found');
            pool.end();
            return;
        }

        const companyId = jobRes.rows[0].company_id;
        console.log('Company ID:', companyId);

        let recruiterId = null;

        if (companyId) {
            // Get recruiter from company creator
            const compRes = await pool.query('SELECT created_by FROM companies WHERE id = $1', [companyId]);
            if (compRes.rows.length > 0) {
                recruiterId = compRes.rows[0].created_by;
                console.log('Recruiter ID (from company):', recruiterId);
            }
        }

        if (!recruiterId) {
            // Fallback: get any recruiter
            console.log('No recruiter found via company, fetching distinct recruiter...');
            const userRes = await pool.query("SELECT id FROM users WHERE role = 'recruiter' LIMIT 1");
            if (userRes.rows.length > 0) {
                recruiterId = userRes.rows[0].id;
                console.log('Recruiter ID (fallback):', recruiterId);
            } else {
                console.log('Error: No recruiter users found in system');
                pool.end();
                return;
            }
        }

        // 2. Create a new test
        console.log('Creating new test...');
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const createRes = await pool.query(`
            INSERT INTO tests (
                job_id, recruiter_id, title, description, instructions,
                duration_minutes, start_date, start_time, end_date, end_time,
                status, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                60, $6, '09:00', $7, '23:00',
                'published', NOW(), NOW()
            ) RETURNING id
        `, [
            jobId, recruiterId,
            'Replacement Aptitude Test',
            'A new test created to replace the missing one.',
            'Please complete this test.',
            now, tomorrow
        ]);

        const newTestId = createRes.rows[0].id;
        console.log('Created new test:', newTestId);

        // 3. Update application
        const candidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';
        console.log('Updating application for candidate:', candidateId);

        await pool.query(`
            UPDATE job_applications
            SET test_id = $1, test_status = 'pending'
            WHERE candidate_id = $2 AND job_id = $3
        `, [newTestId, candidateId, jobId]);

        console.log('✅ Application updated with new test ID');

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
