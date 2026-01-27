import express from 'express';
import pool from '../config/db.js';
import { syncJobs } from '../services/adzunaService.js';
import { fetchJoobleJobs } from '../services/joobleService.js';

const router = express.Router();

/**
 * GET /api/jobs/india
 * Fetch external jobs from Adzuna (DB) and Jooble (API).
 * Unified search with deduplication.
 */
router.get('/india', async (req, res) => {
    try {
        const {
            location,
            role,
            type,
            experience,
            page = 1,
            limit = 10
        } = req.query;

        console.log('Incoming Job Search Filters:', { location, role, type, experience, page, limit });

        const offset = (page - 1) * limit;

        // Trigger Adzuna sync if DB is empty
        const countRes = await pool.query("SELECT COUNT(*) FROM job_postings WHERE source = 'external'");
        const totalInDb = parseInt(countRes.rows[0].count);

        if (totalInDb === 0) {
            console.log('Database empty, triggering initial Adzuna sync...');
            await syncJobs();
        }

        // 1. Build Adzuna Query (DB)
        let query = `
            SELECT *, COUNT(*) OVER() as total_count FROM job_postings 
            WHERE source = 'external' 
            AND source_name = 'adzuna'
        `;
        const params = [];
        let paramIdx = 1;

        // TOLERANT LOCATION: Check location column, job_title, and job_description
        if (location && location.trim()) {
            query += ` AND (location ILIKE $${paramIdx} OR job_title ILIKE $${paramIdx} OR job_description ILIKE $${paramIdx})`;
            params.push(`%${location.trim()}%`);
            paramIdx++;
        }

        if (role && role.trim()) {
            const keywords = role.trim().split(/\s+/).filter(k => k.length > 0);
            const roleConditions = [];
            keywords.forEach(keyword => {
                roleConditions.push(`job_title ILIKE $${paramIdx}`);
                roleConditions.push(`job_description ILIKE $${paramIdx}`);
                params.push(`%${keyword}%`);
                paramIdx++;
            });
            if (roleConditions.length > 0) {
                query += ` AND (${roleConditions.join(' OR ')})`;
            }
        }

        if (type && type.trim()) {
            query += ` AND (job_type ILIKE $${paramIdx} OR job_title ILIKE $${paramIdx} OR job_description ILIKE $${paramIdx})`;
            params.push(`%${type.trim()}%`);
            paramIdx++;
        }

        if (experience && experience.trim()) {
            let expKeyword = experience.trim();
            if (expKeyword.toLowerCase() === 'fresher') expKeyword = '0-1|entry|fresher|graduate';
            else if (expKeyword.toLowerCase() === 'junior') expKeyword = '1-3|junior|associate';
            else if (expKeyword.toLowerCase() === 'mid') expKeyword = '3-6|mid|intermediate';
            else if (expKeyword.toLowerCase() === 'senior') expKeyword = '6+|senior|expert|lead';

            query += ` AND (experience_level ~* $${paramIdx} OR job_title ~* $${paramIdx} OR job_description ~* $${paramIdx})`;
            params.push(expKeyword);
            paramIdx++;
        }

        query += ` ORDER BY last_synced_at DESC NULLS LAST, created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        params.push(limit, offset);

        console.log('📊 Fetching jobs from Adzuna (DB) and Jooble (API)...');

        // 2. Execute Parallel Requests (Adzuna DB + Jooble API)
        const [adzunaResult, joobleResult] = await Promise.all([
            pool.query(query, params),
            fetchJoobleJobs({ location, role, page }) // Jooble handles its own filtering
        ]);

        const adzunaJobs = adzunaResult.rows;
        const joobleJobs = joobleResult.jobs || [];

        const adzunaTotal = adzunaJobs.length > 0 ? parseInt(adzunaJobs[0].total_count) : 0;
        const joobleTotal = joobleResult.total || 0;

        console.log(`📊 Raw Results - Adzuna: ${adzunaJobs.length}/${adzunaTotal}, Jooble: ${joobleJobs.length}/${joobleTotal}`);

        // 3. Deduplication (Prioritize Adzuna)
        // Create identifiers for Adzuna jobs to check against Jooble
        const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const adzunaSignatures = new Set(adzunaJobs.map(job => {
            const company = job.external_company_name || 'unknown';
            return `${normalize(job.job_title)}_${normalize(company)}_${normalize(job.location)}`;
        }));

        const uniqueJoobleJobs = joobleJobs.filter(job => {
            const signature = `${normalize(job.job_title)}_${normalize(job.external_company_name)}_${normalize(job.location)}`;
            const isDuplicate = adzunaSignatures.has(signature);
            // if (isDuplicate) console.log(`Duplicate filtered: ${job.job_title} at ${job.external_company_name}`);
            return !isDuplicate;
        });

        const duplicatesRemoved = joobleJobs.length - uniqueJoobleJobs.length;
        if (duplicatesRemoved > 0) {
            console.log(`🔄 Deduplication: Removed ${duplicatesRemoved} duplicate(s) from Jooble results`);
        }

        // 4. Merge
        const unifiedJobs = [...adzunaJobs, ...uniqueJoobleJobs];
        const unifiedTotal = adzunaTotal + joobleTotal;

        console.log(`✅ Final Results: Adzuna (${adzunaJobs.length}), Jooble (${uniqueJoobleJobs.length}) → Total: ${unifiedJobs.length}`);

        res.json({
            success: true,
            count: unifiedJobs.length,
            total: unifiedTotal,
            page: parseInt(page),
            limit: parseInt(limit),
            sources: {
                adzuna: adzunaJobs.length,
                jooble: uniqueJoobleJobs.length
            },
            data: unifiedJobs
        });

    } catch (error) {
        console.error('Error in unified job search:', error);
        res.status(500).json({ success: false, message: 'Server error during unified search' });
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
                salary_min, salary_max, job_description, required_skills, status, company_id,
                require_education, require_skills
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'Open'), $11, $12, $13)
            RETURNING job_id;
        `;

        const jobValues = [
            job_title, department, job_type, experience_level, location,
            salary_min ? parseInt(salary_min) : null,
            salary_max ? parseInt(salary_max) : null,
            job_description, required_skills, status, companyId,
            req.body.require_education || false,
            req.body.require_skills || false
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
 * GET /api/jobs/recruiter
 * Fetch jobs ONLY for the logged-in recruiter's company.
 * Strictly enforces data ownership.
 */
router.get('/recruiter', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Resolve Company ID owned by Recruiter
        const companyQuery = 'SELECT id FROM companies WHERE created_by = $1';
        const { rows: companyRows } = await pool.query(companyQuery, [userId]);

        if (companyRows.length === 0) {
            // Recruiter hasn't created a company yet, so no jobs.
            return res.json({ success: true, count: 0, data: [] });
        }

        const companyId = companyRows[0].id;

        // 2. Fetch Jobs for this Company ONLY
        const jobsQuery = `
            SELECT 
                job_id, job_title, department, job_type, 
                experience_level, location, status, 
                created_at, updated_at,
                require_education, require_skills
            FROM job_postings
            WHERE company_id = $1
            ORDER BY created_at DESC
        `;

        const { rows: jobs } = await pool.query(jobsQuery, [companyId]);

        res.json({
            success: true,
            count: jobs.length,
            data: jobs
        });

    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
            SET job_title = COALESCE($1, job_title), 
                department = COALESCE($2, department), 
                job_type = COALESCE($3, job_type), 
                experience_level = COALESCE($4, experience_level), 
                location = COALESCE($5, location), 
                salary_min = COALESCE($6, salary_min), 
                salary_max = COALESCE($7, salary_max), 
                job_description = COALESCE($8, job_description), 
                required_skills = COALESCE($9, required_skills), 
                status = COALESCE($10, status), 
                require_education = COALESCE($12, require_education),
                require_skills = COALESCE($13, require_skills),
                updated_at = CURRENT_TIMESTAMP
            WHERE job_id = $11
        `;
        const updateValues = [
            job_title || null,
            department || null,
            job_type || null,
            experience_level || null,
            location || null,
            salary_min || null,
            salary_max || null,
            job_description || null,
            required_skills || null,
            status || null,
            jobId,
            req.body.require_education !== undefined ? req.body.require_education : null,
            req.body.require_skills !== undefined ? req.body.require_skills : null
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

        // 4. Update Questions (Smart Sync Strategy)
        // Fetch existing question IDs to determine updates vs deletes
        const existingQsRes = await client.query('SELECT id FROM job_questions WHERE job_id = $1', [jobId]);
        const existingQIds = existingQsRes.rows.map(r => r.id);

        const incomingQIds = (questions || []).filter(q => q.id).map(q => q.id);
        const questionsToDelete = existingQIds.filter(id => !incomingQIds.includes(id));

        // 1. Safely Delete Removed Questions
        for (const id of questionsToDelete) {
            try {
                await client.query('DELETE FROM job_questions WHERE id = $1', [id]);
            } catch (err) {
                // If referenced by applications, ignore deletion to preserve data integrity
                console.warn(`Skipping deletion of question ${id} due to constraints`, err.message);
            }
        }

        // 2. Upsert (Update existing / Insert new)
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const updateQQuery = `
                UPDATE job_questions 
                SET question_text = $1, question_type = $2, options = $3, is_required = $4
                WHERE id = $5
            `;
            const insertQQuery = `
                INSERT INTO job_questions (job_id, question_text, question_type, options, is_required)
                VALUES ($1, $2, $3, $4, $5)
            `;

            for (const q of questions) {
                if (q.question_text && q.question_type) {
                    if (q.id && existingQIds.includes(q.id)) {
                        // Update
                        await client.query(updateQQuery, [
                            q.question_text,
                            q.question_type,
                            q.options || null,
                            q.is_required !== false,
                            q.id
                        ]);
                    } else {
                        // Insert
                        await client.query(insertQQuery, [
                            jobId,
                            q.question_text,
                            q.question_type,
                            q.options || null,
                            q.is_required !== false
                        ]);
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Job updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating job:', error);
        import('fs').then(fs => {
            fs.appendFileSync('backend_error.log', `[${new Date().toISOString()}] Update Error: ${error.stack || error}\n`);
        });
        res.status(500).json({ success: false, message: 'Server error', error: error.message }); // Expose error for debugging
    } finally {
        client.release();
    }
});

export default router;
