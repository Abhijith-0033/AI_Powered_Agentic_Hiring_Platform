
import pool from '../config/db.js';

const checkSchema = async () => {
    try {
        console.log('--- Candidates Table ---');
        const candidatesRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates';
        `);
        console.table(candidatesRes.rows);

        console.log('\n--- Job Postings Table ---');
        const jobsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings';
        `);
        console.table(jobsRes.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSchema();
