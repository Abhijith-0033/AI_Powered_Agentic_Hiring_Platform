import pool from './config/db.js';

/**
 * Migration Script: Add name to credentials and link candidates table
 * 
 * This script:
 * 1. Adds name column to credentials table
 * 2. Adds user_id column to candidates table
 * 3. Backfills user_id for existing candidates
 * 4. Creates foreign key constraint
 */
async function migrateSchema() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting schema migration...\n');

        await client.query('BEGIN');

        // Step 1: Add name column to credentials
        console.log('1️⃣  Adding name column to credentials table...');
        await client.query(`
            ALTER TABLE credentials 
            ADD COLUMN IF NOT EXISTS name VARCHAR(255)
        `);
        console.log('   ✅ Name column added to credentials\n');

        // Step 2: Add user_id column to candidates
        console.log('2️⃣  Adding user_id column to candidates table...');
        await client.query(`
            ALTER TABLE candidates 
            ADD COLUMN IF NOT EXISTS user_id UUID
        `);
        console.log('   ✅ User_id column added to candidates\n');

        // Step 3: Backfill user_id for existing candidates
        console.log('3️⃣  Backfilling user_id for existing candidates...');
        const backfillResult = await client.query(`
            UPDATE candidates c
            SET user_id = cr.id
            FROM credentials cr
            WHERE c.email = cr.email AND c.user_id IS NULL
        `);
        console.log(`   ✅ Backfilled ${backfillResult.rowCount} candidate records\n`);

        // Step 4: Create foreign key constraint (drop if exists first)
        console.log('4️⃣  Creating foreign key constraint...');

        // Drop constraint if it exists
        await client.query(`
            ALTER TABLE candidates 
            DROP CONSTRAINT IF EXISTS fk_candidates_user_id
        `);

        // Create new constraint
        await client.query(`
            ALTER TABLE candidates 
            ADD CONSTRAINT fk_candidates_user_id 
            FOREIGN KEY (user_id) 
            REFERENCES credentials(id) 
            ON DELETE CASCADE
        `);
        console.log('   ✅ Foreign key constraint created\n');

        // Step 5: Verify the migration
        console.log('5️⃣  Verifying migration...');

        const credentialsCheck = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'credentials' AND column_name = 'name'
        `);

        const candidatesCheck = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates' AND column_name = 'user_id'
        `);

        const fkCheck = await client.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'candidates' 
            AND constraint_name = 'fk_candidates_user_id'
        `);

        if (credentialsCheck.rows.length > 0) {
            console.log('   ✅ credentials.name column exists');
        }
        if (candidatesCheck.rows.length > 0) {
            console.log('   ✅ candidates.user_id column exists');
        }
        if (fkCheck.rows.length > 0) {
            console.log('   ✅ Foreign key constraint exists\n');
        }

        await client.query('COMMIT');

        console.log('✨ Migration completed successfully!\n');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        console.error('\nRolling back changes...\n');
        process.exit(1);
    } finally {
        client.release();
    }
}

migrateSchema();
