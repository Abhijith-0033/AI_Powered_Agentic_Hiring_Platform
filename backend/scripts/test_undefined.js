
import pool from '../config/db.js';

async function testUndefined() {
    try {
        console.log('Testing undefined parameter...');
        const res = await pool.query('SELECT $1::text as val', [undefined]);
        console.log('Result:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error with undefined:', err.message);
        process.exit(1);
    }
}

testUndefined();
