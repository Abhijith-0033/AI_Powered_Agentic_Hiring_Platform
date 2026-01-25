import pool from './config/db.js';

async function quickCheck() {
    try {
        const result = await pool.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'candidates' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%user_id%';
        `);

        console.log('UNIQUE constraints on candidates table with user_id:');
        console.log(result.rows);

        if (result.rows.length === 0) {
            console.log('\n❌ NO UNIQUE CONSTRAINT ON user_id!');
            console.log('Running fix now...');

            await pool.query(`
                ALTER TABLE candidates 
                ADD CONSTRAINT candidates_user_id_key UNIQUE (user_id);
            `);

            console.log('✅ Constraint added!');
        } else {
            console.log('\n✅ Constraint exists');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
    process.exit(0);
}

quickCheck();
