import pool from '../config/db.js';

/**
 * Migration: Create candidate_resumes table
 * Supports multiple resumes per candidate (max 5)
 */
async function createCandidateResumesTable() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting candidate_resumes table migration...');

        await client.query('BEGIN');

        // 1. Create candidate_resumes table
        console.log('📝 Creating candidate_resumes table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_resumes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID NOT NULL,
                resume_name VARCHAR(150) NOT NULL,
                file_url TEXT NOT NULL,
                file_size_kb INTEGER,
                mime_type VARCHAR(50) DEFAULT 'application/pdf',
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                
                -- Foreign key constraint
                CONSTRAINT fk_candidate 
                    FOREIGN KEY (candidate_id) 
                    REFERENCES candidates(id) 
                    ON DELETE CASCADE,
                
                -- File size constraint (max 10MB = 10240KB)
                CONSTRAINT check_file_size 
                    CHECK (file_size_kb IS NULL OR file_size_kb <= 10240)
            );
        `);
        console.log('✅ Table created successfully');

        // 2. Create index for performance
        console.log('📝 Creating index on candidate_id...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_candidate_resumes_candidate_id 
            ON candidate_resumes(candidate_id);
        `);
        console.log('✅ Index created successfully');

        // 3. Migrate existing resume data from candidates table
        console.log('📝 Checking for existing resumes to migrate...');
        const existingResumes = await client.query(`
            SELECT id, resume_pdf, name 
            FROM candidates 
            WHERE resume_pdf IS NOT NULL AND resume_pdf != ''
        `);

        if (existingResumes.rows.length > 0) {
            console.log(`📦 Found ${existingResumes.rows.length} existing resumes to migrate`);

            for (const row of existingResumes.rows) {
                const { id: candidateId, resume_pdf, name } = row;

                // Calculate file size from base64 string
                let fileSizeKb = null;
                try {
                    // Remove data URI prefix if present
                    const base64Data = resume_pdf.includes('base64,')
                        ? resume_pdf.split('base64,')[1]
                        : resume_pdf;

                    // Calculate buffer size and convert to KB
                    const buffer = Buffer.from(base64Data, 'base64');
                    fileSizeKb = Math.ceil(buffer.length / 1024);
                } catch (e) {
                    console.warn(`⚠️  Could not calculate file size for candidate ${candidateId}`);
                }

                // Insert migrated resume
                await client.query(`
                    INSERT INTO candidate_resumes 
                        (candidate_id, resume_name, file_url, file_size_kb, is_default, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                `, [
                    candidateId,
                    `${name || 'Resume'}_migrated.pdf`,
                    resume_pdf,
                    fileSizeKb,
                    true  // Set as default
                ]);

                console.log(`  ✓ Migrated resume for candidate ${candidateId}`);
            }

            console.log('✅ Migration of existing resumes complete');
        } else {
            console.log('ℹ️  No existing resumes found to migrate');
        }

        // 4. Optionally: Keep resume_pdf column for backward compatibility
        // If you want to remove it later, uncomment the following:
        /*
        console.log('📝 Dropping resume_pdf column from candidates table...');
        await client.query(`
            ALTER TABLE candidates DROP COLUMN IF EXISTS resume_pdf;
        `);
        console.log('✅ Column dropped successfully');
        */
        console.log('ℹ️  Keeping resume_pdf column in candidates table for backward compatibility');

        await client.query('COMMIT');
        console.log('🎉 Migration completed successfully!');

        // Show summary
        const count = await client.query('SELECT COUNT(*) FROM candidate_resumes');
        console.log(`📊 Total resumes in candidate_resumes table: ${count.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    } finally {
        client.release();
    }
}

createCandidateResumesTable();
