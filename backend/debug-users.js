
import pool from './config/db.js';

const check = async () => {
    const client = await pool.connect();
    try {
        console.log("Checking credentials for 'demo@example.com'...");
        const res = await client.query("SELECT id, email, role, created_at FROM credentials WHERE email = 'demo@example.com'");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit(0);
    }
};

check();
