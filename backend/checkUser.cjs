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
        // Find user and candidate for noname@gmail.com
        const result = await pool.query(`
            SELECT u.id as user_id, u.email, u.role, c.id as candidate_id
            FROM users u
            LEFT JOIN candidates c ON u.id = c.user_id
            WHERE u.email = $1
        `, ['noname@gmail.com']);

        if (result.rows.length === 0) {
            console.log('No user found with email: noname@gmail.com');
        } else {
            const user = result.rows[0];
            console.log('User found:');
            console.log('  Email:', user.email);
            console.log('  Role:', user.role);
            console.log('  User ID:', user.user_id);
            console.log('  Candidate ID:', user.candidate_id || 'NONE');

            if (user.candidate_id) {
                // Check applications
                const apps = await pool.query(`
                    SELECT id, job_id, test_id, status
                    FROM job_applications
                    WHERE candidate_id = $1
                `, [user.candidate_id]);

                console.log('\nApplications:', apps.rows.length);
                apps.rows.forEach(app => {
                    console.log(`  Job ${app.job_id}: test_id=${app.test_id || 'null'}, status=${app.status}`);
                });
            }
        }

        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        pool.end();
    }
})();
