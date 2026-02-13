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

(async () => {
    try {
        console.log('--- Test Attempts Table ---');
        const tpParams = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_attempts'`);
        tpParams.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // Also check if there is a separate table for answers?
        // test_answers?

        console.log('\n--- Test Answers Table? ---');
        const taParams = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_answers'`);
        taParams.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
