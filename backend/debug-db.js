
import pool from './config/db.js';

const debug = async () => {
    const client = await pool.connect();
    try {
        console.log('--- TABLES ---');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.table(tables.rows);

        // Try querying users if it exists in the list above, otherwise skip
        // For now, let's just inspect tables first.
    } catch (err) {
        console.error("Error listing tables:", err);
    }

    try {
        console.log('--- CANDIDATES ---');
        const candidates = await client.query('SELECT id, user_id, name, email FROM candidates');
        console.table(candidates.rows);

        console.log('--- COMPANIES ---');
        const companies = await client.query('SELECT id, name, created_by FROM companies');
        console.table(companies.rows);

        console.log('--- JOB APPLICATIONS (Raw) ---');
        const apps = await client.query('SELECT * FROM job_applications');
        console.table(apps.rows);

        if (apps.rows.length > 0) {
            const firstApp = apps.rows[0];
            console.log('--- DIAGNOSIS FOR APP ID', firstApp.id, '---');

            // Check Job
            const job = await client.query('SELECT job_id, company_id, job_title FROM job_postings WHERE job_id = $1', [firstApp.job_id]);
            console.log('Linked Job:', job.rows[0] || 'MISSING');

            if (job.rows.length > 0) {
                // Check Company
                const company = await client.query('SELECT id, name, created_by FROM companies WHERE id = $1', [job.rows[0].company_id]);
                console.log('Linked Company:', company.rows[0] || 'MISSING');
            }

            // Check Candidate
            const candidate = await client.query('SELECT id, name, email FROM candidates WHERE id = $1', [firstApp.candidate_id]);
            console.log('Linked Candidate:', candidate.rows[0] || 'MISSING');
        } else {
            console.log("No applications found in DB.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

debug();
