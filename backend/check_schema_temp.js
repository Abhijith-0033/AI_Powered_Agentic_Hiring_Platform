import pool from './config/db.js';

const checkTables = async () => {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('--- ALL TABLES ---');
        console.log(res.rows.map(r => r.table_name).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkTables();
