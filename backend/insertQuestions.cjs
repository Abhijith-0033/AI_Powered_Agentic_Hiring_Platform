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

const testId = 'af0d9288-f587-47fa-ad7f-4e884bfb9866';

(async () => {
    try {
        console.log(`Adding questions to test ${testId}...`);

        const q1 = {
            text: 'What is 2 + 2?',
            type: 'objective',
            options: JSON.stringify(['3', '4', '5', '6']),
            answer: '4',
            order: 1
        };

        const q2 = {
            text: 'Which of these is a prime number?',
            type: 'objective',
            options: JSON.stringify(['4', '6', '7', '9']),
            answer: '7',
            order: 2
        };

        await pool.query(`
            INSERT INTO test_questions (
                test_id, question_text, question_type, options, expected_answer, question_order, created_at
            ) VALUES 
            ($1, $2, $3, $4, $5, $6, NOW()),
            ($1, $7, $8, $9, $10, $11, NOW())
        `, [
            testId,
            q1.text, q1.type, q1.options, q1.answer, q1.order,
            q2.text, q2.type, q2.options, q2.answer, q2.order
        ]);

        console.log('✅ Added 2 questions successfully');

        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
})();
