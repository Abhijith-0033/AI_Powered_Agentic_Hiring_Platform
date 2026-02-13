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

pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
`).then(result => {
    console.log('Database tables:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    pool.end();
}).catch(error => {
    console.error('Error:', error.message);
    pool.end();
});
