import pool from './config/db.js';

const checkTables = async () => {
    try {
        const tablesToCheck = ['candidate_education', 'candidate_experience', 'candidate_achievements', 'candidate_projects'];
        for (const table of tablesToCheck) {
            const res = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)", [table]);
            console.log(`${table}: ${res.rows[0].exists}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkTables();
