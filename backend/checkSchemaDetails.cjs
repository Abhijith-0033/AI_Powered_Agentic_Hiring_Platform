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
        console.log('--- Tests Table ---');
        const tParams = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'tests'`);
        tParams.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) nullable: ${r.is_nullable}`));

        console.log('\n--- Companies Table ---');
        const cParams = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies'`);
        cParams.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        console.log('\n--- Recruiters Table? ---');
        const rParams = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%recruiter%'`);
        rParams.rows.forEach(r => console.log(`  Found table: ${r.table_name}`));

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
