import pool from './config/db.js';

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates' 
            ORDER BY ordinal_position
        `);

        console.log('Candidates table columns:');
        res.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkSchema();
