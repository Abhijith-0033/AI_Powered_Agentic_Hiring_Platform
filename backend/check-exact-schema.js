import pool from './config/db.js';

async function checkSchema() {
    try {
        console.log('=== CHECKING TABLE SCHEMAS ===\n');

        // Check job_applications table
        console.log('1. job_applications columns:');
        const ja = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_applications' 
            ORDER BY ordinal_position
        `);
        ja.rows.forEach(col => console.log(`   ${col.column_name} (${col.data_type})`));

        // Check job_postings table  
        console.log('\n2. job_postings columns:');
        const jp = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings' 
            ORDER BY ordinal_position
        `);
        jp.rows.forEach(col => console.log(`   ${col.column_name} (${col.data_type})`));

        // Check candidates table
        console.log('\n3. candidates columns:');
        const cd = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates' 
            ORDER BY ordinal_position
        `);
        cd.rows.forEach(col => console.log(`   ${col.column_name} (${col.data_type})`));

        // Check data
        console.log('\n4. Sample job_applications data:');
        const apps = await pool.query('SELECT * FROM job_applications LIMIT 1');
        if (apps.rows.length > 0) {
            console.log('   Columns:', Object.keys(apps.rows[0]));
        } else {
            console.log('   No data in job_applications table');
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        pool.end();
    }
}

checkSchema();
