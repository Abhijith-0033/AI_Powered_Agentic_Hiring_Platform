import pool from './config/db.js';

async function testQuery() {
    try {
        console.log('Testing SQL Query...');
        const query = "SELECT * FROM job_postings WHERE source IS DISTINCT FROM 'external' AND company_id IS NOT NULL AND status = $1 ORDER BY created_at DESC";
        const params = ['Open'];

        console.log('Query:', query);
        console.log('Params:', params);

        const result = await pool.query(query, params);
        console.log('Success! Found rows:', result.rows.length);
    } catch (error) {
        console.error('SQL Error:', error);
    } finally {
        await pool.end();
    }
}

testQuery();
