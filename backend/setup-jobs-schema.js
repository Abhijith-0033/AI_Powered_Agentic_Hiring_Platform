import pool from './config/db.js';

const createJobPostingsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS job_postings (
        job_id BIGSERIAL PRIMARY KEY,
        job_title VARCHAR(150) NOT NULL,
        department VARCHAR(100) NOT NULL,
        job_type VARCHAR(30) NOT NULL,
        experience_level VARCHAR(30) NOT NULL,
        location VARCHAR(150),
        salary_min INTEGER,
        salary_max INTEGER,
        job_description TEXT NOT NULL,
        required_skills TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    try {
        await pool.query(query);
        console.log("✅ 'job_postings' table created successfully.");
    } catch (error) {
        console.error("❌ Error creating table:", error);
    } finally {
        pool.end();
    }
};

createJobPostingsTable();
