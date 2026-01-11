import pool from './config/db.js';

async function debugInsert() {
    try {
        console.log('Trying insert...');
        const result = await pool.query(
            `INSERT INTO jobs (title, description, skills, location, experience_level) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            ['Test Job', 'Desc', ['Skill1'], 'Remote', 'Senior']
        );
        console.log('Success:', result.rows[0]);
    } catch (error) {
        console.error('Insert Failed:', error);
    } finally {
        pool.end();
    }
}

debugInsert();
