
import pool from './config/db.js';

async function debugState() {
    try {
        console.log('🔍 --- DEBUGGING FULL STATE ---');

        // 1. List all Credentials (Users)
        console.log('\n👤 USERS (credentials table):');
        const users = await pool.query('SELECT id, email, name, role FROM credentials');
        users.rows.forEach(u => console.log(`   [${u.role}] ${u.email} (ID: ${u.id})`));

        // 2. List all Candidates
        console.log('\n📄 CANDIDATES (candidates table):');
        const candidates = await pool.query('SELECT id, user_id, email, name FROM candidates');
        candidates.rows.forEach(c => console.log(`   ${c.email} (ID: ${c.id}, UserID: ${c.user_id})`));

        // 3. List all Applications
        console.log('\n📝 APPLICATIONS (job_applications table):');
        const apps = await pool.query('SELECT id, candidate_id, job_id, status FROM job_applications');

        for (const app of apps.rows) {
            console.log(`   App ID: ${app.id}, Candidate ID: ${app.candidate_id}, Job ID: ${app.job_id}`);

            // Check linking
            const candidate = candidates.rows.find(c => c.id === app.candidate_id);
            if (candidate) {
                console.log(`      -> Linked to Candidate: ${candidate.email}`);
            } else {
                console.log(`      -> ⚠️ ORPHANED (Candidate ID ${app.candidate_id} not found)`);
            }
        }

        // 4. Check Dashboard Logic Simulation
        console.log('\n📊 DASHBOARD STATS CHECK:');
        for (const user of users.rows) {
            if (user.role === 'job_seeker') {
                const candidate = candidates.rows.find(c => c.user_id === user.id);
                if (candidate) {
                    const countRes = await pool.query('SELECT COUNT(*) FROM job_applications WHERE candidate_id = $1', [candidate.id]);
                    console.log(`   User ${user.email}: Found Candidate Profile. App Count: ${countRes.rows[0].count}`);
                } else {
                    console.log(`   User ${user.email}: ⚠️ NO CANDIDATE PROFILE FOUND`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

debugState();
