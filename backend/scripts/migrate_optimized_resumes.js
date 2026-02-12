
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        await client.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS optimized_resumes (
                id SERIAL PRIMARY KEY,
                candidate_id INT REFERENCES candidates(id),
                job_id INT REFERENCES job_postings(id),
                original_score INT,
                optimized_score INT,
                content TEXT NOT NULL,
                suggestions JSONB,
                generation_time_ms INT,
                model_used VARCHAR(50),
                version INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Index for faster lookups
        await client.query(`CREATE INDEX IF NOT EXISTS idx_optimized_resumes_candidate ON optimized_resumes(candidate_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_optimized_resumes_job ON optimized_resumes(job_id);`);

        console.log('✅ Migration: optimized_resumes table created successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
