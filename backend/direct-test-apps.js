import pool from './config/db.js';

const test = async () => {
    const client = await pool.connect();
    try {
        const userId = 'efea794f-f1e4-4745-b8b4-4051ca97b58a';

        // Test the EXACT query from applications.js with LEFT JOINs
        const query = `
            SELECT 
                ja.id, ja.status, ja.applied_at, ja.job_id, ja.resume_name, ja.resume_id,
                jp.job_title,
                c.name as candidate_name, 
                c.email as candidate_email,
                c.experience_years as experience,
                c.skills,
                c.avatar,
                comp.created_by as company_owner
            FROM job_applications ja
            LEFT JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN candidates c ON ja.candidate_id = c.id
            WHERE comp.created_by = $1
            ORDER BY ja.applied_at DESC
        `;

        const result = await client.query(query, [userId]);
        console.log("Query result count:", result.rows.length);
        console.table(result.rows);

        // Also test without WHERE to see all applications
        const allQuery = `
            SELECT 
                ja.id, ja.job_id, ja.candidate_id,
                jp.job_id as jp_job_id, jp.company_id,
                comp.id as comp_id, comp.created_by,
                c.id as cand_id, c.name
            FROM job_applications ja
            LEFT JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN candidates c ON ja.candidate_id = c.id
        `;
        const allResult = await client.query(allQuery);
        console.log("\n=== ALL APPLICATIONS (no filter) ===");
        console.table(allResult.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit(0);
    }
};

test();
