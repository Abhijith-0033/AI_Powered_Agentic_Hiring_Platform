
import pool from './config/db.js';

async function checkApplications() {
    try {
        console.log('Checking job_applications table...');
        const res = await pool.query('SELECT * FROM job_applications');
        console.log(`Found ${res.rows.length} applications.`);
        if (res.rows.length > 0) {
            console.log('Sample application:', res.rows[0]);
        }

        console.log('\nChecking candidates table...');
        const resCandidates = await pool.query('SELECT id, user_id, name, email FROM candidates');
        console.log(`Found ${resCandidates.rows.length} candidates.`);
        if (resCandidates.rows.length > 0) {
            console.log('Sample candidate:', resCandidates.rows[0]);
        }

        // Check for any mismatches
        if (res.rows.length > 0) {
            const sampleApp = res.rows[0];
            const candidate = resCandidates.rows.find(c => c.id === sampleApp.candidate_id);
            if (candidate) {
                console.log(`\nApplication ${sampleApp.id} belongs to candidate ${candidate.name} (User ID: ${candidate.user_id})`);
            } else {
                console.log(`\n⚠️ Application ${sampleApp.id} links to unknown candidate_id ${sampleApp.candidate_id}`);
            }
        }

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        pool.end();
    }
}

checkApplications();
