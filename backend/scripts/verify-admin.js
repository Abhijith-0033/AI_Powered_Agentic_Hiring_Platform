import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

const API_URL = 'http://localhost:5000/api';

async function verifyAdmin() {
    try {
        console.log('🧪 Starting Admin Verification...');

        // 1. Test Admin Login
        console.log('🔑 Testing Admin Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'admin@123'
        });

        if (!loginRes.data.success) {
            throw new Error('Login failed');
        }

        const token = loginRes.data.token;
        console.log('✅ Admin login successful. Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Test Get Users
        console.log('📋 Testing GET /admin/users...');
        const usersRes = await axios.get(`${API_URL}/admin/users`, config);
        if (usersRes.data.success) {
            console.log(`✅ Fetched ${usersRes.data.count} users.`);
        }

        // 3. Test Get Jobs
        console.log('💼 Testing GET /admin/jobs...');
        const jobsRes = await axios.get(`${API_URL}/admin/jobs`, config);
        if (jobsRes.data.success) {
            console.log(`✅ Fetched ${jobsRes.data.count} jobs.`);
        }

        // 4. Test Get Applications
        console.log('📄 Testing GET /admin/applications...');
        const appsRes = await axios.get(`${API_URL}/admin/applications`, config);
        if (appsRes.data.success) {
            console.log(`✅ Fetched ${appsRes.data.count} applications.`);
        }

        console.log('🎉 Admin Verification Passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Note: This script requires the backend server to be running.
// If it's not running, we might need to use direct DB queries for some checks, 
// but testing the API is better.
verifyAdmin();
