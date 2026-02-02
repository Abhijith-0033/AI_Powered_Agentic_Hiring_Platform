
import pool from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const runDebug = async () => {
    try {
        console.log('--- USERS (credentials) ---');
        const users = await pool.query('SELECT id, name, email, role FROM credentials LIMIT 5');
        console.log(JSON.stringify(users.rows, null, 2));

        console.log('\n--- CANDIDATES ---');
        const candidates = await pool.query('SELECT id, user_id, name, email FROM candidates LIMIT 5');
        console.log(JSON.stringify(candidates.rows, null, 2));

        console.log('\n--- ENDPOINT QUERY SIMULATION ---');
        const userId = '0a18389f-c19f-4dc5-b14e-0f21b453405b'; // From previous output
        const query = `
            SELECT 
                ja.id AS application_id,
                ja.job_id,
                ja.status,
                jp.job_title,
                c.name AS company_name
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies c ON ja.company_id = c.id
            JOIN candidates cd ON ja.candidate_id = cd.id
            WHERE cd.user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        console.log(`Endpoint Query Results: ${result.rows.length} rows`);
        console.log(JSON.stringify(result.rows, null, 2));

        if (result.rows.length === 0) {
            console.log('--- DIAGNOSIS ---');
            // check if jobs exist
            const jobs = await pool.query('SELECT job_id FROM job_postings LIMIT 5');
            console.log('Sample Jobs:', JSON.stringify(jobs.rows));
            // check if companies exist
            const comps = await pool.query('SELECT id, name FROM companies LIMIT 5');
            console.log('Sample Companies:', JSON.stringify(comps.rows));
        }

        if (result.rows.length === 0) {
            console.log('NO APPLICATIONS FOUND FOR THIS USER via ENDPOINT QUERY');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

runDebug();
