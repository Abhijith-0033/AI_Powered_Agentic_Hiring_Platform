


const API_URL = 'http://localhost:3000/api';

async function testBackend() {
    try {
        console.log('🔍 Testing Backend API...');

        // 1. Create a Job
        console.log('1️⃣ Creating Test Job...');
        const jobRes = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Senior Backend Engineer',
                description: 'We need a node.js expert with SQL experience.',
                skills: ['Node.js', 'PostgreSQL', 'Express'],
                location: 'Remote',
                experience_level: 'Senior'
            })
        });
        const jobData = await jobRes.json();
        console.log('   Response:', jobData);
        const jobId = jobData.data?.id;

        if (!jobId) throw new Error('Failed to create job');

        // 2. Create a Candidate
        console.log('2️⃣ Creating Test Candidate...');
        const candRes = await fetch(`${API_URL}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'John Doe',
                email: 'john@example.com',
                resume_url: 'http://example.com/resume.pdf',
                skills: ['Node.js', 'React', 'MongoDB'], // Partial match
                experience_years: 5
            })
        });
        const candData = await candRes.json();
        console.log('   Response:', candData);

        // 3. Run Auto Shortlist
        console.log('3️⃣ Running Auto Shortlist...');
        const aiRes = await fetch(`${API_URL}/ai/auto-shortlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
        });
        const aiData = await aiRes.json();
        console.log('   Response:', JSON.stringify(aiData.data, null, 2));

        if (aiData.data && aiData.data.length > 0) {
            console.log('✅ Backend Flow Verified!');
        } else {
            console.warn('⚠️ No results returned from auto-shortlist (might be expected if scoring mismatch)');
        }

    } catch (error) {
        console.error('❌ Backend Test Failed:', error);
    }
}

testBackend();
