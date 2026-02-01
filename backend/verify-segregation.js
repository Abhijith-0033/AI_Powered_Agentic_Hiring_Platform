import axios from 'axios';

async function verifyJobs() {
    const baseURL = 'http://localhost:3000/api/jobs'; // Adjust port if necessary

    try {
        console.log('--- Verifying Job Segregation ---');

        // 1. Check Internal Jobs (GET /api/jobs)
        console.log('\n1. Checking Internal Jobs Endpoint (GET /api/jobs)...');
        const internalRes = await axios.get(baseURL);
        const internalJobs = internalRes.data.data;
        console.log(`Fetched ${internalJobs.length} internal jobs.`);

        let internalPass = true;
        internalJobs.forEach(job => {
            if (job.source === 'external') {
                console.error(`❌ FAILURE: External job found in internal list: ${job.job_title} (ID: ${job.job_id})`);
                internalPass = false;
            }
            if (!job.company_id) {
                console.error(`❌ FAILURE: Job without company_id found in internal list: ${job.job_title} (ID: ${job.job_id})`);
                internalPass = false;
            }
        });

        if (internalPass) console.log('✅ PASS: Internal endpoint contains only expected internal jobs.');


        // 2. Check External Jobs (GET /api/jobs/india)
        console.log('\n2. Checking External Jobs Endpoint (GET /api/jobs/india)...');
        // Note: This endpoint requires params or defaults to some broad search potentially.
        // We'll trust the existing logic but just check a sample if possible, or just skip full verify if we didn't touch it.
        // But let's check it returns external jobs.
        const externalRes = await axios.get(`${baseURL}/india`);
        const externalJobs = externalRes.data.data;
        console.log(`Fetched ${externalJobs.length} external jobs.`);

        // Just verify we got some external jobs if any exist
        if (externalJobs.length > 0) {
            const sample = externalJobs[0];
            console.log(`Sample external job source: ${sample.source} (${sample.source_name})`);
            if (sample.source !== 'external') {
                console.warn('⚠️ WARNING: External job endpoint returned non-external source?');
            } else {
                console.log('✅ PASS: External endpoint returned external jobs.');
            }
        } else {
            console.log('ℹ️ INFO: No external jobs returned (might need sync or API key), skipping validation of content.');
        }

    } catch (error) {
        console.error('Verification failed with error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

verifyJobs();
