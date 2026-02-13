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
        console.log('Checking constraint test_questions_question_type_check...');
        const res = await pool.query(`
            SELECT pg_get_constraintdef(oid) AS constraint_def
            FROM pg_constraint
            WHERE conname = 'test_questions_question_type_check'
        `);
        if (res.rows.length > 0) {
            console.log('Constraint definition:', res.rows[0].constraint_def);
        } else {
            console.log('Constraint not found.');
        }
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
