import pool from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded from the backend directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrateSoftDelete() {
    try {
        console.log('🔄 Running soft delete migration...');

        // Add is_deleted to candidates
        console.log('🔹 Adding is_deleted to candidates table...');
        await pool.query(`
            ALTER TABLE candidates 
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
        `);

        // Add is_deleted to companies
        console.log('🔹 Adding is_deleted to companies table...');
        await pool.query(`
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
        `);

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateSoftDelete();
