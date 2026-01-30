import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function debugMyApps() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'john.doe@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token obtained.');

        console.log('Fetching my applications...');
        await axios.get(`${API_URL}/applications/my-applications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Success! No 500 error.');

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

debugMyApps();
