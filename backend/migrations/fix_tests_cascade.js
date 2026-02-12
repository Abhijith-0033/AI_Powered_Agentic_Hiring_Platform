import pool from '../config/db.js';

/**
 * Migration: Fix cascade behavior on test tables
 * Changes ON DELETE CASCADE to ON DELETE SET NULL for external references
 * so test records persist unless explicitly deleted by recruiter.
 * 
 * Internal cascades (test_questions -> tests, test_answers -> test_attempts) 
 * remain CASCADE so recruiter manual delete still cleans up properly.
 */
async function fixTestsCascade() {
    const client = await pool.connect();
    try {
        console.log('🔄 Fixing test table cascade policies...');
        await client.query('BEGIN');

        // 1. Fix tests.job_id: CASCADE -> SET NULL
        console.log('  Fixing tests.job_id...');
        // Make column nullable
        await client.query(`ALTER TABLE tests ALTER COLUMN job_id DROP NOT NULL`);
        // Drop old FK and recreate with SET NULL
        await client.query(`
            ALTER TABLE tests 
            DROP CONSTRAINT IF EXISTS tests_job_id_fkey
        `);
        await client.query(`
            ALTER TABLE tests 
            ADD CONSTRAINT tests_job_id_fkey 
            FOREIGN KEY (job_id) REFERENCES job_postings(job_id) ON DELETE SET NULL
        `);
        console.log('  ✅ tests.job_id now SET NULL on delete');

        // 2. Fix test_attempts.candidate_id: CASCADE -> SET NULL
        console.log('  Fixing test_attempts.candidate_id...');
        await client.query(`ALTER TABLE test_attempts ALTER COLUMN candidate_id DROP NOT NULL`);
        await client.query(`
            ALTER TABLE test_attempts 
            DROP CONSTRAINT IF EXISTS test_attempts_candidate_id_fkey
        `);
        await client.query(`
            ALTER TABLE test_attempts 
            ADD CONSTRAINT test_attempts_candidate_id_fkey 
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE SET NULL
        `);
        console.log('  ✅ test_attempts.candidate_id now SET NULL on delete');

        // 3. Fix test_attempts.application_id: CASCADE -> SET NULL
        console.log('  Fixing test_attempts.application_id...');
        await client.query(`ALTER TABLE test_attempts ALTER COLUMN application_id DROP NOT NULL`);
        await client.query(`
            ALTER TABLE test_attempts 
            DROP CONSTRAINT IF EXISTS test_attempts_application_id_fkey
        `);
        await client.query(`
            ALTER TABLE test_attempts 
            ADD CONSTRAINT test_attempts_application_id_fkey 
            FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE SET NULL
        `);
        console.log('  ✅ test_attempts.application_id now SET NULL on delete');

        await client.query('COMMIT');
        console.log('🎉 Cascade fix migration completed!');
        console.log('   Test records will now persist until manually deleted by the recruiter.');
        process.exit(0);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
    }
}

fixTestsCascade();
