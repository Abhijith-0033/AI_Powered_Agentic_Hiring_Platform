import pool from './config/db.js';

async function testFixedQuery() {
    try {
        console.log('=== TESTING FIXED QUERY ===\n');

        // Get a sample user_id
        const userResult = await pool.query("SELECT id, email FROM credentials WHERE role = 'job_seeker' LIMIT 1");
        if (userResult.rows.length === 0) {
            console.log('No job seeker found');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log(`Testing with user: ${userResult.rows[0].email} (${userId})\n`);

        // Run the FIXED query
        const query = `
            SELECT 
                ja.id AS application_id,
                ja.status,
                ja.applied_at,
                ja.applied_at as last_update,
                jp.job_title,
                jp.location,
                c.name AS company_name,
                c.logo AS company_logo
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies c ON ja.company_id = c.id
            JOIN candidates cd ON ja.candidate_id = cd.id
            WHERE cd.user_id = $1
            ORDER BY ja.applied_at DESC
        `;

        const result = await pool.query(query, [userId]);
        console.log(`✅ Query executed successfully!`);
        console.log(`Found ${result.rows.length} applications\n`);

        if (result.rows.length > 0) {
            console.log('Sample applications:');
            result.rows.forEach((app, i) => {
                console.log(`${i + 1}. ${app.job_title} at ${app.company_name} - ${app.status}`);
            });
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        pool.end();
    }
}

testFixedQuery();
