
import pool from './config/db.js';

const fix = async () => {
    const client = await pool.connect();
    try {
        console.log("Searching for recruiter...");
        // Find most recent recruiter
        const res = await client.query("SELECT id, email FROM credentials WHERE role = 'recruiter' ORDER BY created_at DESC LIMIT 1");
        if (res.rows.length === 0) {
            console.log("No recruiter found!");
            return;
        }
        const recruiter = res.rows[0];
        console.log("Found recruiter:", recruiter.email, recruiter.id);

        // Update companies
        const updateRes = await client.query("UPDATE companies SET created_by = $1", [recruiter.id]);
        console.log(`Updated ${updateRes.rowCount} companies to be owned by ${recruiter.email}`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        // Force exit because pool keeps process alive
        process.exit(0);
    }
};

fix();
