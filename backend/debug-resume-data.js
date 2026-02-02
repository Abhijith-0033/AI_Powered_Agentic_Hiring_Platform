
import pool from './config/db.js';

async function debugResumes() {
    try {
        console.log('--- Debugging Resume Data ---');

        // 1. Check Job Applications
        const appsRes = await pool.query(`
            SELECT 
                ja.id, 
                ja.job_id, 
                ja.candidate_id, 
                ja.resume_id, 
                ja.resume_name,
                length(ja.resume_data) as resume_data_len,
                ja.resume_data IS NOT NULL as has_ja_data
            FROM job_applications ja
            LIMIT 5
        `);
        console.log('\nLast 5 Job Applications:');
        console.table(appsRes.rows);

        // 2. Check Candidate Resumes for those IDs
        if (appsRes.rows.length > 0) {
            const resumeIds = appsRes.rows
                .map(r => r.resume_id)
                .filter(id => id !== null);

            if (resumeIds.length > 0) {
                const resumesRes = await pool.query(`
                    SELECT 
                        id, 
                        resume_name,
                        length(file_url) as file_url_len,
                        file_url IS NOT NULL as has_file_url
                    FROM candidate_resumes
                    WHERE id = ANY($1)
                `, [resumeIds]);

                console.log('\nLinked Candidate Resumes:');
                console.table(resumesRes.rows);
            } else {
                console.log('\nNo linked resume_ids found in applications.');
            }
        }

    } catch (err) {
        console.error('Debug Error:', err);
    } finally {
        pool.end();
    }
}

debugResumes();
