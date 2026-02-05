import pool from '../config/db.js';

/**
 * Migration: Add interviewer columns to interviews table
 * Purpose: Support algorithmic interviewer assignment
 * Date: 2026-02-02
 */
async function addInterviewerColumns() {
    const client = await pool.connect();
    try {
        console.log('🔄 Adding interviewer columns to interviews table...');

        await client.query('BEGIN');

        // Add interviewer-related columns
        console.log('📝 Adding interviewer_name column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS interviewer_name VARCHAR(255)
        `);

        console.log('📝 Adding interviewer_email column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS interviewer_email VARCHAR(255)
        `);

        console.log('📝 Adding interviewer_index column...');
        await client.query(`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS interviewer_index INTEGER
        `);

        await client.query('COMMIT');
        console.log('✅ Interviewer columns added successfully!');
        console.log('🎉 Migration completed!');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

addInterviewerColumns();
