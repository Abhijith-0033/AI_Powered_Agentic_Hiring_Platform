
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

const databaseUrl = env.NEON_DATABASE_URL || env.DATABASE_URL;
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    const client = await pool.connect();
    try {
        const candidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';

        console.log('Running exact my-tests query...\n');

        const query = `
            SELECT t.id, t.title, t.description, t.instructions,
                   TO_CHAR(t.start_date, 'YYYY-MM-DD') as start_date, t.start_time,
                   TO_CHAR(t.end_date, 'YYYY-MM-DD') as end_date, t.end_time,
                   t.duration_minutes, t.status as test_status, t.results_published,
                   jp.job_title, comp.name as company_name,
                   ja.id as application_id, ja.test_status as my_test_status,
                   ta.id as attempt_id, ta.status as attempt_status,
                   ta.total_score, ta.max_score, ta.submitted_at
            FROM job_applications ja
            JOIN tests t ON ja.test_id = t.id
            JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN test_attempts ta ON ta.test_id = t.id AND ta.candidate_id = $1
            WHERE ja.candidate_id = $1 AND t.status = 'published'
            ORDER BY t.start_date ASC, t.start_time ASC
        `;

        const result = await client.query(query, [candidateId]);

        console.log(`Rows returned: ${result.rows.length}\n`);

        if (result.rows.length > 0) {
            result.rows.forEach((row, idx) => {
                console.log(`Test ${idx + 1}:`);
                console.log(`  Title: ${row.title}`);
                console.log(`  Start: ${row.start_date} ${row.start_time}`);
                console.log(`  End: ${row.end_date} ${row.end_time}`);
                console.log(`  Status: ${row.test_status}`);
                console.log(`  Company: ${row.company_name || 'N/A'}`);
                console.log();
            });
        } else {
            console.log('NO TESTS RETURNED!');

            // Debug: check if the application exists
            const appCheck = await client.query(
                'SELECT id, test_id FROM job_applications WHERE candidate_id = $1 AND test_id IS NOT NULL',
                [candidateId]
            );
            console.log(`\nApplications with tests: ${appCheck.rows.length}`);
            appCheck.rows.forEach(a => {
                console.log(`  App ID: ${a.id}, Test ID: ${a.test_id}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        pool.end();
    }
})();
