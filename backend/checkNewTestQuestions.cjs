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

const testId = '1960f150-545c-4c19-87de-e198918c9b19';

(async () => {
    try {
        console.log(`Checking questions for test ${testId}...`);
        const res = await pool.query('SELECT * FROM test_questions WHERE test_id = $1 ORDER BY question_order', [testId]);

        console.log(`Found ${res.rows.length} questions.`);
        res.rows.forEach(q => {
            console.log(`- Q${q.question_order}: ${q.question_text} [${q.question_type}]`);
        });

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
