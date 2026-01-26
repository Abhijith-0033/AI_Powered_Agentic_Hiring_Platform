
import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = express.Router();

/**
 * POST /api/jobs/:id/apply
 * Apply to a job with resume and answers
 * Auth: Job Seeker only
 */
router.post('/jobs/:id/apply', auth, roleGuard('job_seeker'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const jobId = req.params.id;
        const { resume_id, answers } = req.body;

        if (!resume_id) {
            return res.status(400).json({ success: false, message: 'Resume is required' });
        }

        // 1. Get Candidate ID
        const candidateRes = await client.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );
        if (candidateRes.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // 2. Verify Resume & Get Data
        const resumeRes = await client.query(
            'SELECT file_url, resume_name FROM candidate_resumes WHERE id = $1 AND candidate_id = $2',
            [resume_id, candidateId]
        );
        if (resumeRes.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid resume selected' });
        }
        const { file_url, resume_name } = resumeRes.rows[0];

        // 3. Get Job & Company Info
        const jobRes = await client.query(
            'SELECT company_id, status FROM job_postings WHERE job_id = $1',
            [jobId]
        );
        if (jobRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        const { company_id, status } = jobRes.rows[0];

        if (status !== 'Open') {
            return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
        }

        // 4. Validate Questions/Answers (Optional but recommended)
        // For now trusting client on structure, but verifying mandatory could be added here.

        await client.query('BEGIN');

        // 5. Insert Application
        const appQuery = `
            INSERT INTO job_applications (
                job_id, candidate_id, company_id, 
                resume_id, resume_name, resume_data, 
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'applied')
            RETURNING id
        `;
        const appValues = [jobId, candidateId, company_id, resume_id, resume_name, file_url];
        const appResult = await client.query(appQuery, appValues);
        const applicationId = appResult.rows[0].id;

        // 6. Insert Answers
        if (answers && answers.length > 0) {
            const answerQuery = `
                INSERT INTO job_application_answers (application_id, question_id, answer)
                VALUES ($1, $2, $3)
            `;
            for (const ans of answers) {
                await client.query(answerQuery, [applicationId, ans.question_id, ans.answer]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: { applicationId }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ success: false, message: 'You have already applied to this job' });
        }
        console.error('Error submitting application:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/recruiter/jobs/:id/applications
 * Get all applications for a specific job
 * Auth: Recruiter (Owner only)
 */
router.get('/recruiter/jobs/:id/applications', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.userId;

        // Verify Ownership
        const ownershipCheck = await pool.query(`
            SELECT 1 
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `, [jobId, userId]);

        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Fetch Applications with Candidate Details & Answers
        // Using JSON logic to bundle answers might be cleaner, but simple join is fine for now
        const appsQuery = `
            SELECT 
                ja.id, ja.status, ja.applied_at, ja.resume_id, ja.resume_name,
                c.name as candidate_name, c.email as candidate_email, c.experience_years,
                c.id as candidate_id,
                json_agg(
                    json_build_object(
                        'question', jq.question_text,
                        'answer', jaa.answer,
                        'type', jq.question_type
                    )
                ) as answers
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            LEFT JOIN job_application_answers jaa ON ja.id = jaa.application_id
            LEFT JOIN job_questions jq ON jaa.question_id = jq.id
            WHERE ja.job_id = $1
            GROUP BY ja.id, c.id
            ORDER BY ja.applied_at DESC
        `;

        const { rows } = await pool.query(appsQuery, [jobId]);

        res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/recruiter/applications
 * Get ALL applications for recruiter's company
 */
router.get('/recruiter/applications', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        import('fs').then(fs => {
            fs.appendFileSync('debug_id.log', `Request UserId: ${userId} at ${new Date().toISOString()}\n`);
        });
        console.log('Recruiter fetching applications. userId:', userId);

        const allAppsQuery = `
            SELECT 
                ja.id, ja.status, ja.applied_at, ja.job_id, ja.resume_name, ja.resume_id,
                jp.job_title,
                c.name as candidate_name, 
                c.email as candidate_email,
                c.experience_years as experience,
                c.skills,
                comp.created_by as company_owner
            FROM job_applications ja
            LEFT JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN candidates c ON ja.candidate_id = c.id
            WHERE comp.created_by = $1
            ORDER BY ja.applied_at DESC
        `;

        const { rows } = await pool.query(allAppsQuery, [userId]);

        // Write result to log file for agent inspection
        import('fs').then(fs => {
            fs.appendFileSync('debug_id.log', `Request UserId: ${userId} Count: ${rows.length} Data: ${JSON.stringify(rows[0] || 'NONE')}\n`);
        });

        console.log(`Found ${rows.length} applications for recruiter ${userId}.`);
        res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Error fetching all applications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * PATCH /api/recruiter/applications/:id/status
 * Update application status
 */
router.patch('/recruiter/applications/:id/status', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const appId = req.params.id;
        const { status } = req.body;
        const userId = req.user.userId;

        // Verify Ownership happens implicitly by checking join with companies
        const updateQuery = `
            UPDATE job_applications ja
            SET status = $1
            FROM companies c
            WHERE ja.company_id = c.id
            AND c.created_by = $2
            AND ja.id = $3
            RETURNING ja.id, ja.status
        `;

        const { rows } = await pool.query(updateQuery, [status, userId, appId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found or access denied' });
        }

        res.json({ success: true, message: 'Status updated', data: rows[0] });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/recruiter/applications/:id/resume
 * Stream the resume file for a specific application
 * Auth: Recruiter only (owner of the job)
 */
router.get('/recruiter/applications/:id/resume', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const applicationId = req.params.id;

        // 1. Verify Ownership & Fetch Resume Data
        // We join to companies to check if the current user (recruiter) owns the company that owns the job
        const query = `
            SELECT ja.resume_data, ja.resume_name, ja.resume_id
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies c ON jp.company_id = c.id
            WHERE ja.id = $1 AND c.created_by = $2
        `;

        const { rows } = await client.query(query, [applicationId, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
        }

        const { resume_data, resume_name } = rows[0];

        if (!resume_data) {
            return res.status(404).json({ success: false, message: 'No resume data found for this application' });
        }

        // 2. Process Base64 Data
        // The data might be a raw base64 string or a Data URI (data:application/pdf;base64,...)
        // We need to strip the prefix if it exists
        let base64Data = resume_data;
        if (base64Data.includes('base64,')) {
            base64Data = base64Data.split('base64,')[1];
        }

        const fileBuffer = Buffer.from(base64Data, 'base64');

        // 3. Send File
        res.setHeader('Content-Type', 'application/pdf'); // Assuming PDF, could infer from name or signature
        res.setHeader('Content-Disposition', `inline; filename="${resume_name || 'resume.pdf'}"`);
        res.send(fileBuffer);

    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});

export default router;
