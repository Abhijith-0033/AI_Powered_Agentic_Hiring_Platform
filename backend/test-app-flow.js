import pool from './config/db.js';

async function testApplicationFlow() {
    try {
        console.log('=== TESTING APPLICATION FLOW ===\n');

        // 1. List all users
        console.log('1. ALL USERS:');
        const users = await pool.query('SELECT id, email, name, role FROM credentials ORDER BY id');
        users.rows.forEach(u => console.log(`   [${u.role}] ${u.email} (user_id: ${u.id})`));

        // 2. List all candidates
        console.log('\n2. ALL CANDIDATES:');
        const candidates = await pool.query('SELECT id, user_id, email, name FROM candidates ORDER BY id');
        candidates.rows.forEach(c => console.log(`   ${c.email} (candidate_id: ${c.id}, user_id: ${c.user_id})`));

        // 3. List all applications
        console.log('\n3. ALL APPLICATIONS:');
        const apps = await pool.query('SELECT id, candidate_id, job_id, status, applied_at FROM job_applications ORDER BY applied_at DESC');
        console.log(`   Total: ${apps.rows.length}`);
        apps.rows.forEach(app => console.log(`   App ${app.id}: candidate_id=${app.candidate_id}, job_id=${app.job_id}, status=${app.status}`));

        // 4. Test the exact query from backend
        console.log('\n4. TESTING BACKEND QUERY FOR EACH USER:');
        for (const user of users.rows.filter(u => u.role === 'job_seeker')) {
            console.log(`\n   Testing for user: ${user.email} (user_id: ${user.id})`);

            const query = `
                SELECT 
                    ja.id AS application_id,
                    ja.status,
                    ja.applied_at,
                    ja.updated_at as last_update,
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

            const result = await pool.query(query, [user.id]);
            console.log(`   Result: ${result.rows.length} applications found`);
            if (result.rows.length > 0) {
                result.rows.forEach(app => console.log(`      - ${app.job_title} at ${app.company_name} (${app.status})`));
            }
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        pool.end();
    }
}

testApplicationFlow();
