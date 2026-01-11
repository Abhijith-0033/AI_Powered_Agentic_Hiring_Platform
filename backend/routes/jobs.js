import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

/**
 * GET /api/jobs
 * Read ONLY from job_postings table.
 * Filter by status='Open' by default (or 'all' if requested).
 * Order by created_at DESC.
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM job_postings';
        const params = [];

        // By default, show only open jobs unless 'all' is requested
        if (status !== 'all') {
            query += ' WHERE status = $1';
            params.push('Open');
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/jobs
 * Insert ONLY into job_postings table.
 * Validate required fields: job_title, department, job_type, experience_level, job_description, required_skills.
 * No mock data allowed.
 */
router.post('/', async (req, res) => {
    try {
        const {
            job_title,
            department,
            job_type,
            experience_level,
            location,
            salary_min,
            salary_max,
            job_description,
            required_skills,
            status // Optional, default handled by DB
        } = req.body;

        // Validation
        if (!job_title || !department || !job_type || !experience_level || !job_description || !required_skills) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: job_title, department, job_type, experience_level, job_description, required_skills'
            });
        }

        const query = `
            INSERT INTO job_postings (
                job_title, department, job_type, experience_level, location, 
                salary_min, salary_max, job_description, required_skills, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'Open'))
            RETURNING *;
        `;

        const values = [
            job_title, department, job_type, experience_level, location,
            salary_min ? parseInt(salary_min) : null,
            salary_max ? parseInt(salary_max) : null,
            job_description, required_skills, status
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, data: result.rows[0], message: 'Job posted successfully' });

    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/jobs/:id - Get single job details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM job_postings WHERE job_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
