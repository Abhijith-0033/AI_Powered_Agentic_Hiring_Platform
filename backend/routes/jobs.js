import express from 'express';
import pool from '../config/db.js';
import { syncJobs } from '../services/adzunaService.js';

const router = express.Router();

/**
 * GET /api/jobs/india
 * Fetch external jobs from Adzuna (India).
 * Trigger sync if needed (simplified: trigger on request or rely on bg job).
 * For this task, we'll try to sync if we have few jobs or just return what we have to be fast,
 * but let's trigger a sync asynchronously so the user gets fresh data eventually.
 * Or better: await sync if count is 0, otherwise return cached and sync in bg.
 */
router.get('/india', async (req, res) => {
    try {
        // Optional: Trigger sync if empty or stale (basic logic)
        // Check count of external jobs
        const countQuery = "SELECT COUNT(*) FROM job_postings WHERE source = 'external'";
        const countRes = await pool.query(countQuery);
        const count = parseInt(countRes.rows[0].count);

        if (count === 0) {
            console.log('No external jobs found, syncing...');
            await syncJobs();
        } else {
            // Background sync for freshness (fire and forget)
            syncJobs().catch(err => console.error('Background sync error:', err));
        }

        const query = `
            SELECT * FROM job_postings 
            WHERE source = 'external' 
            AND source_name = 'adzuna'
            ORDER BY last_synced_at DESC NULLS LAST, created_at DESC
        `;
        const result = await pool.query(query);

        console.log(`GET /api/jobs/india returned ${result.rows.length} jobs.`);

        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Error fetching external jobs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

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

// Update imports to include middleware
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

/**
 * POST /api/jobs
 * Insert into job_postings, job_requirements, and job_questions table.
 * Validate required fields.
 * Link job to company via company_id from authenticated recruiter.
 */
router.post('/', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
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
            status,
            requirements, // Array of { requirement_text, is_mandatory }
            questions     // Array of { question_text, question_type, options, is_required }
        } = req.body;

        // Validation
        if (!job_title || !department || !job_type || !experience_level || !job_description || !required_skills) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const userId = req.user.userId;

        // Resolve Company ID
        const companyQuery = 'SELECT id FROM companies WHERE created_by = $1';
        const { rows: companyRows } = await pool.query(companyQuery, [userId]);

        if (companyRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please complete your company profile before posting a job.'
            });
        }

        const companyId = companyRows[0].id;

        await client.query('BEGIN');

        // 1. Insert Job
        const jobQuery = `
            INSERT INTO job_postings (
                job_title, department, job_type, experience_level, location, 
                salary_min, salary_max, job_description, required_skills, status, company_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'Open'), $11)
            RETURNING job_id;
        `;

        const jobValues = [
            job_title, department, job_type, experience_level, location,
            salary_min ? parseInt(salary_min) : null,
            salary_max ? parseInt(salary_max) : null,
            job_description, required_skills, status, companyId
        ];

        const jobResult = await client.query(jobQuery, jobValues);
        const newJobId = jobResult.rows[0].job_id;

        // 2. Insert Requirements
        if (requirements && Array.isArray(requirements) && requirements.length > 0) {
            const reqQuery = `
                INSERT INTO job_requirements (job_id, requirement_text, is_mandatory)
                VALUES ($1, $2, $3)
            `;
            for (const req of requirements) {
                if (req.requirement_text) {
                    await client.query(reqQuery, [newJobId, req.requirement_text, req.is_mandatory !== false]);
                }
            }
        }

        // 3. Insert Questions
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const questQuery = `
                INSERT INTO job_questions (job_id, question_text, question_type, options, is_required)
                VALUES ($1, $2, $3, $4, $5)
            `;
            for (const q of questions) {
                if (q.question_text && q.question_type) {
                    await client.query(questQuery, [
                        newJobId,
                        q.question_text,
                        q.question_type,
                        q.options || null,
                        q.is_required !== false
                    ]);
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Job posted successfully', jobId: newJobId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error posting job:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});
/**
 * GET /api/jobs/:id
 * Fetch job details by ID, including company info, requirements, and questions.
 */
router.get('/:id', async (req, res) => {
    try {
        const jobId = req.params.id;

        // 1. Fetch Job & Company
        const jobQuery = `
            SELECT 
                jp.*, 
                c.name as company_name, 
                c.logo as company_logo,
                c.location as company_location
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1
        `;
        const jobResult = await pool.query(jobQuery, [jobId]);

        if (jobResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const job = jobResult.rows[0];
        if (job.company_logo) {
            job.company_logo = `data:image/jpeg;base64,${job.company_logo.toString('base64')}`;
        }

        // 2. Fetch Requirements
        const reqQuery = 'SELECT * FROM job_requirements WHERE job_id = $1 ORDER BY id ASC';
        const reqResult = await pool.query(reqQuery, [jobId]);

        // 3. Fetch Questions
        const questQuery = 'SELECT * FROM job_questions WHERE job_id = $1 ORDER BY id ASC';
        const questResult = await pool.query(questQuery, [jobId]);

        res.json({
            success: true,
            data: {
                ...job,
                requirements: reqResult.rows,
                questions: questResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * PUT /api/jobs/:id
 * Update a job posting
 */
router.put('/:id', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const jobId = req.params.id;
        const {
            job_title, department, job_type, experience_level, location,
            salary_min, salary_max, job_description, required_skills,
            remote, status, requirements, questions
        } = req.body;

        // 1. Verify Ownership
        const checkQuery = `
            SELECT jp.job_id 
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const checkResult = await client.query(checkQuery, [jobId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied or job not found' });
        }

        await client.query('BEGIN');

        // 2. Update Job Posting
        const updateQuery = `
            UPDATE job_postings 
            SET job_title = $1, department = $2, job_type = $3, 
                experience_level = $4, location = $5, salary_min = $6, 
                salary_max = $7, job_description = $8, required_skills = $9, 
                status = COALESCE($10, status), updated_at = CURRENT_TIMESTAMP
            WHERE job_id = $11
        `;
        const updateValues = [
            job_title, department, job_type, experience_level, location,
            salary_min, salary_max, job_description, required_skills,
            status, jobId
        ];
        await client.query(updateQuery, updateValues);

        // 3. Update Requirements (Replace Strategy)
        await client.query('DELETE FROM job_requirements WHERE job_id = $1', [jobId]);

        if (requirements && Array.isArray(requirements) && requirements.length > 0) {
            const reqQuery = `
                INSERT INTO job_requirements (job_id, requirement_text, is_mandatory)
                VALUES ($1, $2, $3)
            `;
            for (const req of requirements) {
                if (req.requirement_text) {
                    await client.query(reqQuery, [jobId, req.requirement_text, req.is_mandatory !== false]);
                }
            }
        }

        // 4. Update Questions (Replace Strategy)
        await client.query('DELETE FROM job_questions WHERE job_id = $1', [jobId]);

        if (questions && Array.isArray(questions) && questions.length > 0) {
            const questQuery = `
                INSERT INTO job_questions (job_id, question_text, question_type, options, is_required)
                VALUES ($1, $2, $3, $4, $5)
            `;
            for (const q of questions) {
                if (q.question_text && q.question_type) {
                    await client.query(questQuery, [
                        jobId,
                        q.question_text,
                        q.question_type,
                        q.options || null,
                        q.is_required !== false
                    ]);
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Job updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating job:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});

export default router;
