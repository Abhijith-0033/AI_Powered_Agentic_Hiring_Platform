import pool from './config/db.js';

async function testProfileSave() {
    const client = await pool.connect();

    try {
        console.log('🔍 Testing profile save endpoint...');

        // Test 1: Check if user_id column exists and has UNIQUE constraint
        console.log('\n📊 Test 1: Checking candidates table schema...');
        const schemaCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'candidates'
            ORDER BY ordinal_position;
        `);

        console.log('Columns in candidates table:');
        schemaCheck.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Test 2: Check constraints
        console.log('\n🔒 Test 2: Checking constraints...');
        const constraintsCheck = await client.query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'candidates';
        `);

        console.log('Constraints:');
        constraintsCheck.rows.forEach(c => {
            console.log(`  - ${c.constraint_name}: ${c.constraint_type}`);
        });

        // Test 3: Check if user_id has unique constraint
        console.log('\n🎯 Test 3: Checking user_id unique constraint...');
        const uniqueCheck = await client.query(`
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

        if (uniqueCheck.rows.length > 0) {
            console.log('✅ user_id has UNIQUE constraint');
        } else {
            console.log('❌ user_id does NOT have UNIQUE constraint!');
            console.log('   This will cause ON CONFLICT (user_id) to fail!');
        }

        // Test 4: Try a simple INSERT with ON CONFLICT
        console.log('\n🧪 Test 4: Testing ON CONFLICT query...');
        const testUserId = '00000000-0000-0000-0000-000000000001';

        try {
            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO candidates (
                    user_id, name, email, is_fresher, experience_years
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    updated_at = NOW()
                RETURNING id;
            `, [testUserId, 'Test User', `test${Date.now()}@example.com`, true, 0]);

            await client.query('ROLLBACK');
            console.log('✅ ON CONFLICT query works!');
            console.log('   Result ID:', result.rows[0].id);
        } catch (err) {
            await client.query('ROLLBACK');
            console.log('❌ ON CONFLICT query FAILED!');
            console.log('   Error:', err.message);
            console.log('   Code:', err.code);
        }

        console.log('\n✅ Diagnostic complete!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

testProfileSave();
