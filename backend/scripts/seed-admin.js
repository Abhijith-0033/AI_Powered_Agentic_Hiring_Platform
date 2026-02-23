import pool from '../config/db.js';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded from the backend directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function seedAdmin() {
    try {
        console.log('🔄 Checking for existing admin account...');

        const email = 'admin@gmail.com';
        const password = 'admin@123';
        const name = 'System Administrator';
        const role = 'admin';

        // Check if admin already exists
        const checkQuery = 'SELECT id FROM credentials WHERE email = $1';
        const { rows } = await pool.query(checkQuery, [email]);

        if (rows.length > 0) {
            console.log('✅ Admin account already exists. Skipping insertion.');
            process.exit(0);
        }

        // Hash password
        console.log('🔐 Hashing password...');
        // bcryptjs default export might be different depending on environment
        const hash = bcryptjs.hashSync ? bcryptjs.hashSync(password, 10) : await bcryptjs.hash(password, 10);

        // Insert admin
        console.log('📥 Inserting admin account...');
        const insertQuery = `
            INSERT INTO credentials (email, password_hash, role, is_verified, name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, role
        `;

        const { rows: insertedRows } = await pool.query(insertQuery, [
            email,
            hash,
            role,
            true, // is_verified
            name
        ]);

        console.log('🎉 Admin account created successfully:', insertedRows[0]);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
