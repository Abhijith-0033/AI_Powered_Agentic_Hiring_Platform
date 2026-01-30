import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:3000/api';
const JOB_ID = 5; // As per user request

// Test User (Job Seeker) - will be updated after seeing test-app-flow.js output
const USER = {
    email: 'john.doe@test.com',
    password: 'password123' // Common test password
};

async function reproduction() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER.email,
            password: USER.password
        });
        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;
        console.log(`Loggged in as ${userId} (Role: ${loginRes.data.user.role})`);

        // Get Resumes to get a valid ID
        console.log('2. Fetching Resumes...');
        const resumeRes = await axios.get(`${API_URL}/candidate/resumes`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        let resumeId;
        if (resumeRes.data.data.length > 0) {
            resumeId = resumeRes.data.data[0].id;
            console.log(`Using Resume ID: ${resumeId}`);
        } else {
            console.error('No resumes found. Test might fail if resume is required.');
        }

        // Payload (Mimic Frontend)
        const payload = {
            resume_id: resumeId, // might be undefined
            answers: [],
            education: [],
            skills: []
        };

        console.log('3. Applying to job...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const applyRes = await axios.post(`${API_URL}/jobs/${JOB_ID}/apply`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Success:', applyRes.data);

    } catch (error) {
        if (error.response) {
            console.error('❌ Request Failed!');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

reproduction();
