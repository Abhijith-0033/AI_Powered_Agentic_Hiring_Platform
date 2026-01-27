import pool from './config/db.js';

async function debugLinkage() {
    try {
        console.log('=== DEBUGGING APPLICATION LINKAGE ===\n');

        // 1. Count applications
        const appCount = await pool.query('SELECT COUNT(*) FROM job_applications');
        console.log(`1. Total applications in database: ${appCount.rows[0].count}\n`);

        if (parseInt(appCount.rows[0].count) === 0) {
            console.log('⚠️  NO APPLICATIONS IN DATABASE - User needs to apply to jobs first!');
        } else {
            // 2. Show all applications with details
            console.log('2. All applications:');
            const apps = await pool.query(`
                SELECT ja.id, ja.candidate_id, ja.job_id, ja.status, ja.applied_at
                FROM job_applications ja
                ORDER BY ja.applied_at DESC
            `);

            for (const app of apps.rows) {
                console.log(`\n   App ID: ${app.id}`);
                console.log(`   - candidate_id: ${app.candidate_id}`);
                console.log(`   - job_id: ${app.job_id}`);
                console.log(`   - status: ${app.status}`);

                // Find the candidate
                const candidate = await pool.query('SELECT id, user_id, email, name FROM candidates WHERE id = $1', [app.candidate_id]);
                if (candidate.rows.length > 0) {
                    const cand = candidate.rows[0];
                    console.log(`   - Candidate: ${cand.name} (${cand.email})`);
                    console.log(`   - Candidate user_id: ${cand.user_id}`);

                    // Find the user
                    const user = await pool.query('SELECT id, email, role FROM credentials WHERE id = $1', [cand.user_id]);
                    if (user.rows.length > 0) {
                        console.log(`   - ✅ Linked to user: ${user.rows[0].email} (${user.rows[0].role})`);
                    } else {
                        console.log(`   - ❌ ORPHANED - user_id ${cand.user_id} not found in credentials`);
                    }
                } else {
                    console.log(`   - ❌ ORPHANED - candidate_id not found`);
                }
            }
        }

        console.log('\n3. All candidates:');
        const candidates = await pool.query('SELECT id, user_id, email, name FROM candidates');
        for (const cand of candidates.rows) {
            console.log(`   - ${cand.email} (candidate_id: ${cand.id}, user_id: ${cand.user_id})`);
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        pool.end();
    }
}

debugLinkage();
