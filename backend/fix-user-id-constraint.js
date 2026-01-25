import pool from './config/db.js';

async function addUserIdConstraint() {
    const client = await pool.connect();

    try {
        console.log('🔧 Adding UNIQUE constraint to user_id column...');

        // First, check if there are any duplicate user_ids
        const duplicateCheck = await client.query(`
            SELECT user_id, COUNT(*) as count
            FROM candidates
            WHERE user_id IS NOT NULL
            GROUP BY user_id
            HAVING COUNT(*) > 1;
        `);

        if (duplicateCheck.rows.length > 0) {
            console.log('⚠️  Found duplicate user_ids:');
            duplicateCheck.rows.forEach(row => {
                console.log(`   user_id: ${row.user_id}, count: ${row.count}`);
            });
            console.log('\n❌ Cannot add UNIQUE constraint with duplicate values!');
            console.log('   Please clean up duplicates first.');
            process.exit(1);
        }

        console.log('✅ No duplicate user_ids found');

        // Add the UNIQUE constraint
        console.log('Adding UNIQUE constraint...');
        await client.query(`
            ALTER TABLE candidates 
            ADD CONSTRAINT candidates_user_id_key UNIQUE (user_id);
        `);

        console.log('✅ UNIQUE constraint added successfully!');

        // Verify it was added
        const verifyCheck = await client.query(`
            SELECT
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'candidates'
                AND tc.constraint_type = 'UNIQUE'
                AND kcu.column_name = 'user_id';
        `);

        if (verifyCheck.rows.length > 0) {
            console.log('✅ Verified: user_id now has UNIQUE constraint');
            console.log(`   Constraint name: ${verifyCheck.rows[0].constraint_name}`);
        }

    } catch (error) {
        console.error('❌ Failed to add constraint:', error.message);
        console.error('   Code:', error.code);
        console.error('   Detail:', error.detail);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

addUserIdConstraint();
