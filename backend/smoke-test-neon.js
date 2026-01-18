import pool from './config/db.js';

/**
 * Smoke Test for Neon PostgreSQL Migration
 * Verifies connection and existence of key tables including the new job_postings usage.
 */

async function smokeTest() {
    console.log('🚀 Starting Neon DB Smoke Test...\n');

    try {
        // 1. Connection Check
        console.log('1️⃣  Testing Connection...');
        const timeResult = await pool.query('SELECT NOW() as current_time');
        console.log('   ✅ Connected! DB Time:', timeResult.rows[0].current_time);

        // 2. Table Checks
        console.log('\n2️⃣  Verifying Key Tables...');
        const tables = ['credentials', 'job_postings', 'candidates', 'job_shortlists'];

        for (const table of tables) {
            const check = await pool.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
                [table]
            );
            if (check.rows[0].exists) {
                const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ✅ Table '${table}' exists (Rows: ${count.rows[0].count})`);
            } else {
                console.error(`   ❌ Table '${table}' NOT FOUND!`);
            }
        }

        // 3. Schema Check for AI Route
        console.log('\n3️⃣  Verifying Schema for AI Route...');
        // Check if job_postings has job_id column
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings' AND column_name = 'job_id'
        `);

        if (columnCheck.rows.length > 0) {
            console.log('   ✅ Table job_postings has column job_id');
        } else {
            console.error('   ❌ Table job_postings MISSING column job_id');
        }

        console.log('\n✨ Smoke Test Completed Successfuly!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Smoke Test Failed:', err);
        process.exit(1);
    }
}

smokeTest();
