import pool from './config/db.js';

(async () => {
    const client = await pool.connect();
    try {
        console.log('Starting retroactive test assignment...');

        // Update all applications that don't have a test but should
        const result = await client.query(`
            UPDATE job_applications ja
            SET test_id = (
                SELECT id FROM tests 
                WHERE job_id = ja.job_id 
                AND status = 'published' 
                ORDER BY created_at DESC 
                LIMIT 1
            ),
            test_status = 'pending'
            WHERE test_id IS NULL
            AND EXISTS (
                SELECT 1 FROM tests 
                WHERE job_id = ja.job_id 
                AND status = 'published'
            )
        `);

        console.log(`✅ Updated ${result.rowCount} applications with missing tests`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        client.release();
    }
})();
