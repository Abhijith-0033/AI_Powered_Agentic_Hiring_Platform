import pg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Force SSL for external DBs like Neon/Supabase
});

async function testProfilePrefill() {
    const client = await pool.connect();
    try {
        console.log('--- Starting Profile Pre-fill Verification ---');

        // 1. Create a dummy user simulating a fresh Google Login
        const testEmail = `test_prefill_${Date.now()}@example.com`;
        const testName = 'Test Prefill User';
        const testGoogleId = `google_${Date.now()}`;

        console.log(`Creating test user: ${testEmail}`);
        const insertRes = await client.query(`
            INSERT INTO credentials (email, name, google_id, role, is_verified, created_at)
            VALUES ($1, $2, $3, 'job_seeker', true, NOW())
            RETURNING id, email, role
        `, [testEmail, testName, testGoogleId]);

        const user = insertRes.rows[0];
        console.log(`User created with ID: ${user.id}`);

        // 2. Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 3. Call GET /api/candidates/profile
        console.log('Calling GET /api/candidates/profile...');
        try {
            // Note: Server MUST be running on localhost:3000
            const response = await axios.get('http://localhost:3000/api/candidates/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;

            // 4. Verify Response
            if (data.success &&
                data.data.personal_info.name === testName &&
                data.data.personal_info.email === testEmail) {
                console.log('✅ verification SUCCESS: Profile pre-filled correctly.');
                console.log(`Received Name: ${data.data.personal_info.name}`);
                console.log(`Received Email: ${data.data.personal_info.email}`);
            } else {
                console.error('❌ verification FAILED: Data mismatch or empty.');
                console.log('Response Data:', JSON.stringify(data, null, 2));
            }

        } catch (apiError) {
            console.error('❌ API Verification FAILED:', apiError.message);
            if (apiError.response) {
                console.error('Status:', apiError.response.status);
                console.error('Data:', apiError.response.data);
            }
        }

        // 5. Cleanup
        console.log('Cleaning up test user...');
        await client.query('DELETE FROM credentials WHERE id = $1', [user.id]);
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

testProfilePrefill();
