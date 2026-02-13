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
        console.log('--- Test Questions Table ---');
        const qParams = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'test_questions'`);
        qParams.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) nullable: ${r.is_nullable}`));

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
