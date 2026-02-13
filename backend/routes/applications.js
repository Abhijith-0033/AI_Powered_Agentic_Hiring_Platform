
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
        const { resume_id, answers, education, skills, profile_snapshot } = req.body;

        if (!resume_id) {
            console.log('[Apply] Missing resume_id in body:', req.body);
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
            'SELECT company_id, status, require_education, require_skills FROM job_postings WHERE job_id = $1',
            [jobId]
        );
        if (jobRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        const { company_id, status, require_education, require_skills } = jobRes.rows[0];

        if (status !== 'Open') {
            return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
        }

        // 4. Validate Requirements
        if (require_education && (!education || education.length === 0)) {
            console.log(`[Apply] Education required but missing. Education: ${JSON.stringify(education)}`);
            return res.status(400).json({ success: false, message: 'Education details are required for this job' });
        }

        if (require_skills && (!skills || skills.length === 0)) {
            console.log(`[Apply] Skills required but missing. Skills: ${JSON.stringify(skills)}`);
            return res.status(400).json({ success: false, message: 'Skills are required for this job' });
        }

        await client.query('BEGIN');

        // Check if there's a published test for this job
        const testCheckQuery = `
            SELECT id FROM tests 
            WHERE job_id = $1 AND status = 'published' 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const testCheckResult = await client.query(testCheckQuery, [jobId]);
        const testId = testCheckResult.rows.length > 0 ? testCheckResult.rows[0].id : null;

        // 5. Insert Application
        const appQuery = `
            INSERT INTO job_applications (
                job_id, candidate_id, company_id, 
                resume_id, resume_name, resume_data, 
                status, test_id, test_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'applied', $7, $8)
            RETURNING id
        `;
        const appValues = [
            jobId, candidateId, company_id, resume_id, resume_name, file_url,
            testId, testId ? 'pending' : null
        ];
        const appResult = await client.query(appQuery, appValues);
        const applicationId = appResult.rows[0].id;

        // 6. Insert Profile Snapshot (NEW)
        if (profile_snapshot && typeof profile_snapshot === 'object') {
            const snapshotQuery = `
                INSERT INTO job_application_profile_snapshot (application_id, job_seeker_id, profile_snapshot)
                VALUES ($1, $2, $3)
            `;
            await client.query(snapshotQuery, [applicationId, candidateId, JSON.stringify(profile_snapshot)]);
            console.log(`[Apply] Profile snapshot saved for application ${applicationId}`);
        }

        // 7. Insert Answers
        if (answers && answers.length > 0) {
            const answerQuery = `
                INSERT INTO job_application_answers (application_id, question_id, answer)
                VALUES ($1, $2, $3)
            `;
            for (const ans of answers) {
                await client.query(answerQuery, [applicationId, ans.question_id, ans.answer]);
            }
        }

        // 8. Insert Education
        if (education && education.length > 0) {
            const eduQuery = `
                INSERT INTO job_application_education (application_id, degree, institution, graduation_year, gpa)
                VALUES ($1, $2, $3, $4, $5)
            `;
            for (const edu of education) {
                await client.query(eduQuery, [applicationId, edu.degree, edu.institution, edu.graduation_year, edu.gpa]);
            }
        }

        // 9. Insert Skills
        if (skills && skills.length > 0) {
            const skillQuery = `
                INSERT INTO job_application_skills (application_id, skill)
                VALUES ($1, $2)
            `;
            for (const skill of skills) {
                await client.query(skillQuery, [applicationId, skill]);
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
 * GET /api/applications/my-applications
 * Get all applications for the logged-in job seeker
 * Auth: Job Seeker
 * STRICT IMPLEMENTATION PER USER REQUEST
 */
router.get('/applications/my-applications', auth, roleGuard('job_seeker'), async (req, res) => {
    const fs = await import('fs');
    const logFile = 'debug-apps.log';
    const log = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

    try {
        const userId = req.user.userId;
        log(`[START] Request for User ID: ${userId}`);

        // 1. Resolve Candidate ID
        const candidateRes = await pool.query(
            'SELECT id, name FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            log(`[ERROR] No candidate profile found for User ID: ${userId}`);
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }

        const candidateId = candidateRes.rows[0].id;
        log(`[INFO] Found Candidate ID: ${candidateId}`);

        // 2. Fetch Applications
        const query = `
            SELECT 
                ja.id AS application_id,
                ja.job_id,
                ja.status,
                ja.applied_at,
                ja.applied_at as last_update,
                jp.job_title,
                jp.location,
                c.name AS company_name,
                c.logo AS company_logo
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies c ON ja.company_id = c.id
            JOIN candidates cd ON ja.candidate_id = cd.id
            WHERE cd.user_id = $1
            ORDER BY ja.applied_at DESC
        `;

        const { rows } = await pool.query(query, [userId]);
        log(`[SUCCESS] Found ${rows.length} applications for User ID: ${userId}`);

        // 3. Construct Summary counts
        const summary = {
            total: rows.length,
            applied: rows.filter(a => (a.status || '').toLowerCase() === 'applied').length,
            shortlisted: rows.filter(a => (a.status || '').toLowerCase() === 'shortlisted').length,
            shortlisted_for_test: rows.filter(a => (a.status || '').toLowerCase() === 'shortlisted_for_test').length,
            interview: rows.filter(a => (a.status || '').toLowerCase() === 'interview').length,
            accepted: rows.filter(a => (a.status || '').toLowerCase() === 'accepted').length,
            rejected: rows.filter(a => (a.status || '').toLowerCase() === 'rejected').length
        };

        // 4. Process Logo and Return Response
        const applications = rows.map(app => {
            if (app.company_logo) {
                app.company_logo = `data:image/jpeg;base64,${app.company_logo.toString('base64')}`;
            }
            return app;
        });

        res.json({
            success: true,
            summary,
            applications
        });

    } catch (error) {
        log(`[FATAL] Error fetching my applications: ${error.message}`);
        console.error('Error fetching my applications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

        // Fetch Applications with Candidate Details & Answers (including expected_answer for recruiters)
        // Using JSON logic to bundle answers might be cleaner, but simple join is fine for now
        const appsQuery = `
            SELECT 
                ja.id, ja.status, ja.applied_at, ja.resume_id, ja.resume_name,
                c.name as candidate_name, c.email as candidate_email, c.experience_years,
                c.id as candidate_id,
                json_agg(DISTINCT jsonb_build_object(
                    'question', jq.question_text,
                    'answer', jaa.answer,
                    'type', jq.question_type,
                    'expected_answer', jq.expected_answer
                )) FILTER (WHERE jaa.id IS NOT NULL) as answers,
                json_agg(DISTINCT jsonb_build_object(
                    'degree', jae.degree,
                    'institution', jae.institution,
                    'graduation_year', jae.graduation_year,
                    'gpa', jae.gpa
                )) FILTER (WHERE jae.id IS NOT NULL) as education,
                json_agg(DISTINCT jas.skill) FILTER (WHERE jas.id IS NOT NULL) as skills
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            LEFT JOIN job_application_answers jaa ON ja.id = jaa.application_id
            LEFT JOIN job_questions jq ON jaa.question_id = jq.id
            LEFT JOIN job_application_education jae ON ja.id = jae.application_id
            LEFT JOIN job_application_skills jas ON ja.id = jas.application_id
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
        const validStatuses = ['applied', 'shortlisted', 'shortlisted_for_test', 'interview', 'accepted', 'rejected'];

        console.log(`[StatusUpdate] App ID: ${appId}, New Status: '${status}', User ID: ${userId}`);

        if (!validStatuses.includes(status)) {
            console.log(`[StatusUpdate] Invalid status '${status}'`);
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        // 1. Fetch current status and verify ownership
        const currentAppRes = await pool.query(`
            SELECT ja.status, ja.candidate_id, ja.job_id
            FROM job_applications ja
            JOIN companies c ON ja.company_id = c.id
            WHERE ja.id = $1 AND c.created_by = $2
        `, [appId, userId]);

        if (currentAppRes.rows.length === 0) {
            console.log(`[StatusUpdate] App or ownership failed. AppId: ${appId}, UserId: ${userId}`);
            return res.status(404).json({ success: false, message: 'Application not found or access denied' });
        }

        const currentStatus = (currentAppRes.rows[0].status || 'applied').toLowerCase();
        const { candidate_id, job_id } = currentAppRes.rows[0];
        console.log(`[StatusUpdate] Current Status (Normalized): '${currentStatus}'`);

        // Allow any valid status change (recruiter can change at any time)

        // 3. Update Status
        const updateQuery = `
            UPDATE job_applications
            SET status = $1
            WHERE id = $2
            RETURNING id, status
        `;

        const { rows } = await pool.query(updateQuery, [status, appId]);

        // 4. Auto-create interview record when status changes to 'interview'
        let interviewData = null;
        if (status === 'interview' && candidate_id && job_id) {
            try {
                // Check if interview already exists
                const existingInterview = await pool.query(
                    'SELECT id FROM interviews WHERE application_id = $1',
                    [appId]
                );

                if (existingInterview.rows.length === 0) {
                    // Generate a unique channel name
                    const channelName = `interview_${appId}_${Date.now()}`;

                    const insertRes = await pool.query(`
                        INSERT INTO interviews (
                            job_id, application_id, candidate_id, recruiter_id,
                            channel_name, status, created_at, updated_at
                        )
                        VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
                        RETURNING id, channel_name, status
                    `, [job_id, appId, candidate_id, userId, channelName]);

                    interviewData = insertRes.rows[0];
                    console.log(`[StatusUpdate] Auto-created interview record: ${interviewData.id}`);
                } else {
                    console.log(`[StatusUpdate] Interview record already exists for app ${appId}`);
                }
            } catch (interviewError) {
                console.error('[StatusUpdate] Error auto-creating interview:', interviewError.message);
                // Don't fail the status update if interview creation fails
            }
        }

        console.log(`[StatusUpdate] Success. Updated to '${status}'`);
        res.json({ success: true, message: 'Status updated', data: { ...rows[0], interview: interviewData } });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/recruiter/interview-candidates
 * Get candidates selected for interview or test from job_applications
 * Auth: Recruiter only
 */
router.get('/recruiter/interview-candidates', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        const query = `
            SELECT 
                ja.id, ja.status, ja.applied_at, ja.job_id, ja.resume_name, ja.resume_id,
                ja.candidate_id,
                jp.job_title,
                c.name as candidate_name, 
                c.email as candidate_email,
                c.experience_years as experience,
                c.skills,
                comp.name as company_name,
                i.id as interview_id,
                i.channel_name,
                i.status as interview_status,
                i.interview_date,
                i.start_time,
                i.end_time,
                i.email_sent
            FROM job_applications ja
            LEFT JOIN job_postings jp ON ja.job_id = jp.job_id
            LEFT JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN candidates c ON ja.candidate_id = c.id
            LEFT JOIN interviews i ON i.application_id = ja.id
            WHERE comp.created_by = $1
              AND ja.status IN ('interview', 'shortlisted_for_test')
            ORDER BY ja.applied_at DESC
        `;

        const { rows } = await pool.query(query, [userId]);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching interview candidates:', error);
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

/**
 * GET /api/recruiter/applications/:id/profile-snapshot
 * Fetch candidate profile snapshot (or fallback to live data)
 * Auth: Recruiter only (owner of the job)
 */
router.get('/recruiter/applications/:id/profile-snapshot', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const applicationId = req.params.id;

        // 1. Verify Ownership & Get Application Data
        const appQuery = `
            SELECT ja.id, ja.candidate_id, ja.applied_at
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies c ON jp.company_id = c.id
            WHERE ja.id = $1 AND c.created_by = $2
        `;
        const { rows: appRows } = await pool.query(appQuery, [applicationId, userId]);

        if (appRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
        }

        const { candidate_id, applied_at } = appRows[0];

        // 2. Try to fetch snapshot
        const snapshotQuery = `
            SELECT profile_snapshot, created_at 
            FROM job_application_profile_snapshot 
            WHERE application_id = $1
        `;
        const { rows: snapshotRows } = await pool.query(snapshotQuery, [applicationId]);

        if (snapshotRows.length > 0) {
            // Return snapshot
            return res.json({
                success: true,
                data: {
                    snapshot: snapshotRows[0].profile_snapshot,
                    is_snapshot: true,
                    snapshot_date: snapshotRows[0].created_at
                }
            });
        }

        // 3. Fallback: Fetch live candidate data
        const liveQuery = `
            SELECT 
                c.name, c.email, c.phone, c.location, c.linkedin, c.github,
                c.about, c.job_title as title, c.skills, c.experience_years
            FROM candidates c
            WHERE c.id = $1
        `;
        const { rows: liveRows } = await pool.query(liveQuery, [candidate_id]);

        if (liveRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        const liveData = liveRows[0];

        // Fetch education, experience, achievements, projects
        const eduQuery = 'SELECT * FROM candidate_education WHERE candidate_id = $1';
        const expQuery = 'SELECT * FROM candidate_experience WHERE candidate_id = $1';
        const achQuery = 'SELECT * FROM candidate_achievements WHERE candidate_id = $1';
        const projQuery = 'SELECT * FROM candidate_projects WHERE candidate_id = $1';

        const [eduRes, expRes, achRes, projRes] = await Promise.all([
            pool.query(eduQuery, [candidate_id]),
            pool.query(expQuery, [candidate_id]),
            pool.query(achQuery, [candidate_id]),
            pool.query(projQuery, [candidate_id])
        ]);

        const liveSnapshot = {
            personal_info: {
                name: liveData.name,
                email: liveData.email,
                phone: liveData.phone,
                location: liveData.location,
                linkedin: liveData.linkedin,
                github: liveData.github,
                about: liveData.about,
                title: liveData.title
            },
            skills: liveData.skills ? (typeof liveData.skills === 'string' ? liveData.skills.split(',') : liveData.skills) : [],
            education: eduRes.rows,
            experience: expRes.rows,
            achievements: achRes.rows,
            projects: projRes.rows,
            snapshot_timestamp: applied_at
        };

        return res.json({
            success: true,
            data: {
                snapshot: liveSnapshot,
                is_snapshot: false, // Indicates this is live data, not a snapshot
                snapshot_date: null
            }
        });

    } catch (error) {
        console.error('Error fetching profile snapshot:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
