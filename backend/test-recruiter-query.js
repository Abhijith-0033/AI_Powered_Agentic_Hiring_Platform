
import pool from './config/db.js';

const test = async () => {
    const client = await pool.connect();
    try {
        const recruiterId = 'efea794f-f1e4-4745-b8b4-4051ca97b58a';
        console.log("Testing query for recruiterId:", recruiterId);

        // 1. Check Company
        const compRes = await client.query("SELECT id, name, created_by FROM companies WHERE created_by = $1", [recruiterId]);
        console.log("Owned Companies:", compRes.rows);

        if (compRes.rows.length === 0) {
            console.log("CRITICAL: Recruiter owns NO companies.");
            return;
        }

        const companyId = compRes.rows[0].id;

        // 2. Check Jobs for this company
        const jobsRes = await client.query("SELECT job_id, job_title FROM job_postings WHERE company_id = $1", [companyId]);
        console.log("Company Jobs:", jobsRes.rows);

        if (jobsRes.rows.length === 0) {
            console.log("Recruiter has NO jobs posted.");
            return;
        }

        const jobIds = jobsRes.rows.map(j => j.job_id);

        // 3. Check Applications for these jobs
        const appsRes = await client.query("SELECT id, job_id, candidate_id, status FROM job_applications WHERE job_id = ANY($1)", [jobIds]);
        console.log("Applications for these jobs:", appsRes.rows);

        // 4. Run the full JOIN query from applications.js
        const fullQuery = `
            SELECT 
                ja.id, ja.status, ja.applied_at, ja.job_id, ja.resume_name, ja.resume_id,
                jp.job_title,
                c.name as candidate_name, 
                c.email as candidate_email
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies comp ON jp.company_id = comp.id
            JOIN candidates c ON ja.candidate_id = c.id
            WHERE comp.created_by = $1
        `;
        const finalRes = await client.query(fullQuery, [recruiterId]);
        console.log("FULL JOIN RESULT COUNT:", finalRes.rows.length);
        console.table(finalRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit(0);
    }
};

test();
