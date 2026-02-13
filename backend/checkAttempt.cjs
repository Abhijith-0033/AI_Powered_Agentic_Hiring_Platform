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
const candidateId = '1bdcbd5d-95ce-438d-b160-70be10053735';

(async () => {
    try {
        console.log(`Checking attempts for test ${testId}...`);
        const res = await pool.query(`
            SELECT id, status, total_score, max_score, submitted_at 
            FROM test_attempts 
            WHERE test_id = $1 AND candidate_id = $2
        `, [testId, candidateId]);

        if (res.rows.length === 0) {
            console.log('No attempt found.');
        } else {
            console.log('Attempt found:');
            const att = res.rows[0];
            console.log(`- ID: ${att.id}`);
            console.log(`- Status: ${att.status}`);
            console.log(`- Score: ${att.total_score}/${att.max_score}`);
            console.log(`- Submitted At: ${att.submitted_at}`);

            // Check answers
            const ansRes = await pool.query('SELECT question_id, candidate_answer, is_correct FROM test_answers WHERE attempt_id = $1', [att.id]);
            console.log(`- Answers Count: ${ansRes.rows.length}`);
            ansRes.rows.forEach(a => {
                console.log(`  Q: ${a.question_id}, Ans: ${a.candidate_answer}, Correct: ${a.is_correct}`);
            });
        }

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
