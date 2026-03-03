import pool from './config/db.js';

const verifyFix = async () => {
    try {
        console.log('--- VERIFYING PROFILE SNAPSHOT FALLBACK ---');

        // 1. Get an application ID and its candidate ID
        const appRes = await pool.query(`
            SELECT ja.id, ja.candidate_id 
            FROM job_applications ja 
            LIMIT 1
        `);

        if (appRes.rows.length === 0) {
            console.log('No applications found to test with.');
            process.exit(0);
        }

        const { id: applicationId, candidate_id } = appRes.rows[0];
        console.log(`Testing with Application ID: ${applicationId}, Candidate ID: ${candidate_id}`);

        // 2. Check if snapshot exists
        const snapshotRes = await pool.query('SELECT profile_snapshot FROM job_application_profile_snapshot WHERE application_id = $1', [applicationId]);

        if (snapshotRes.rows.length > 0) {
            const snapshot = snapshotRes.rows[0].profile_snapshot;
            console.log('Snapshot found.');
            if (snapshot.profile_image_url) {
                if (snapshot.profile_image_url.startsWith('data:image')) {
                    console.log('✅ Snapshot contains valid base64 image data.');
                } else if (snapshot.profile_image_url.startsWith('blob:')) {
                    console.log('❌ Snapshot contains invalid blob URL.');
                } else {
                    console.log(`Snapshot contains image URL but not base64: ${snapshot.profile_image_url.substring(0, 30)}...`);
                }
            } else {
                console.log('Snapshot does not contain profile_image_url.');
            }
        } else {
            console.log('No snapshot found. Falling back to live data simulation.');
        }

        // 3. Simulate Live Fallback Logic
        const imgRes = await pool.query(
            'SELECT image_data, image_type FROM job_seeker_profile_image WHERE job_seeker_id = $1',
            [candidate_id]
        );

        if (imgRes.rows.length > 0) {
            const { image_data, image_type } = imgRes.rows[0];
            const base64 = `data:${image_type || 'image/png'};base64,${image_data.toString('base64')}`;
            console.log('✅ Live photo fallback: Successfully fetched and converted to base64.');
            console.log(`Preview: ${base64.substring(0, 50)}...`);
        } else {
            console.log('Candidate has no live profile image.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
};

verifyFix();
