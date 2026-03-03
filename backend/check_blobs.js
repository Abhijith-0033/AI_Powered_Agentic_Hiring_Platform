import pool from './config/db.js';

const checkBlobUrls = async () => {
    try {
        const res = await pool.query("SELECT id, profile_snapshot->>'profile_image_url' as url FROM job_application_profile_snapshot");
        const blobSnapshots = res.rows.filter(r => r.url && r.url.startsWith('blob:'));
        console.log(`Total snapshots: ${res.rows.length}`);
        console.log(`Snapshots with blob URL: ${blobSnapshots.length}`);
        if (blobSnapshots.length > 0) {
            console.log('Sample blob ID:', blobSnapshots[0].id);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkBlobUrls();
