
import pool from '../config/db.js';

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS generated_cover_letters (
                id SERIAL PRIMARY KEY,
                candidate_id UUID NOT NULL,
                job_id INT NOT NULL,
                content TEXT,
                prompt_version VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version INT DEFAULT 1,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id),
                FOREIGN KEY (job_id) REFERENCES job_postings(job_id)
            );
        `);
        console.log('✅ generated_cover_letters table created successfully');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    } finally {
        // We don't close the pool here because this script might be part of a larger migration runner
        // But for standalone execution:
        process.exit();
    }
};

createTable();
