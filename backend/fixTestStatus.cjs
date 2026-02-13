const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) {
        const val = v.join('=').trim();
        env[k.trim()] = val.replace(/^['"]|['"]$/g, '');
    }
});

const pool = new Pool({
    connectionString: env.NEON_DATABASE_URL || env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const testId = '21a55959-276a-407d-9d1a-b311353eb257';

(async () => {
    try {
        console.log('Updating test status to published...');

        const result = await pool.query(`
            UPDATE tests
            SET status = 'published'
            WHERE id = $1
            RETURNING id, title, status
        `, [testId]);

        if (result.rows.length > 0) {
            console.log('✅ Test updated successfully:');
            console.log(`  ID: ${result.rows[0].id}`);
            console.log(`  Title: ${result.rows[0].title}`);
            console.log(`  Status: ${result.rows[0].status}`);
        } else {
            console.log('⚠️  No test found with that ID');
        }

        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        pool.end();
    }
})();
