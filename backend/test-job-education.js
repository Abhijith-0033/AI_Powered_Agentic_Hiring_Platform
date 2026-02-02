
import pool from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        console.log('Testing required_education field...');

        // 1. Verify Column
        const schemaRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings' 
            AND column_name = 'required_education';
        `);
        if (schemaRes.rows.length === 0) throw new Error('Column missing!');
        console.log('✅ Column exists.');

        // 2. Test Fetch Recruiter Jobs (Mocking user ID not easy without auth middleware context, or direct DB query)
        // We will just insert a dummy job manually and select it back to verify the field storage.

        console.log('Inserting test job...');
        const insertRes = await pool.query(`
            INSERT INTO job_postings (
                job_title, department, job_type, experience_level, location, 
                salary_min, salary_max, job_description, required_skills, status, 
                require_education, required_education
            )
            VALUES (
                'Test Job', 'Eng', 'Full-time', 'Senior', 'Remote', 
                100, 200, 'Desc', 'Node', 'Open', 
                true, 'Bachelor Degree Test'
            )
            RETURNING job_id;
        `);
        const jobId = insertRes.rows[0].job_id;
        console.log('Job inserted, ID:', jobId);

        // 3. Fetch back
        const fetchRes = await pool.query(`
            SELECT required_education FROM job_postings WHERE job_id = $1
        `, [jobId]);

        if (fetchRes.rows[0].required_education === 'Bachelor Degree Test') {
            console.log('✅ Field storage verified!');
        } else {
            console.error('❌ Field storage failed:', fetchRes.rows[0]);
        }

        // Cleanup
        await pool.query('DELETE FROM job_postings WHERE job_id = $1', [jobId]);
        console.log('Cleanup complete.');

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        await pool.end();
    }
};

runTest();
