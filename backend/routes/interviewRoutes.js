import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { generateAgoraToken, generateChannelName } from '../utils/agoraToken.js';
import { sendInterviewEmail } from '../utils/emailService.js';
import { scheduleInterviewsWithRoundRobin } from '../services/schedulingAlgorithm.js';

const router = express.Router();

/**
 * POST /api/interviews/select
 * Select a candidate for interview (creates pending interview record)
 * Accessible by: Recruiter only
 */
router.post('/select', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const { jobId, applicationId, candidateId } = req.body;

        // Validation
        if (!jobId || !applicationId || !candidateId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: jobId, applicationId, candidateId'
            });
        }

        // Verify recruiter owns the job
        const ownershipQuery = `
            SELECT jp.job_id, jp.job_title, c.name AS company_name
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const ownershipResult = await client.query(ownershipQuery, [jobId, userId]);

        if (ownershipResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied or job not found'
            });
        }

        const { job_title, company_name } = ownershipResult.rows[0];

        // Check if interview already exists
        const existingQuery = `
            SELECT id, status FROM interviews 
            WHERE application_id = $1
        `;
        const existing = await client.query(existingQuery, [applicationId]);

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Interview already exists for this application (Status: ${existing.rows[0].status})`
            });
        }

        // Generate unique channel name
        const channelName = generateChannelName();

        // Create interview record
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO interviews (
                job_id, application_id, candidate_id, recruiter_id,
                channel_name, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
            RETURNING id, channel_name, status
        `;

        const result = await client.query(insertQuery, [
            jobId,
            applicationId,
            candidateId,
            userId,
            channelName
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Candidate selected for interview successfully',
            data: {
                interviewId: result.rows[0].id,
                channelName: result.rows[0].channel_name,
                status: result.rows[0].status,
                jobTitle: job_title,
                companyName: company_name
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error selecting candidate for interview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to select candidate for interview',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/interviews/create-and-schedule
 * Combined endpoint: creates interview record (if needed) and schedules it in one shot
 * Accessible by: Recruiter only
 */
router.post('/create-and-schedule', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const { jobId, applicationId, candidateId, interviewDate, startTime, endTime } = req.body;

        console.log('[CreateAndSchedule] Received:', { jobId, applicationId, candidateId, interviewDate, startTime, endTime, userId });

        // Validation
        if (!jobId || !applicationId || !candidateId || !interviewDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Verify recruiter owns the job
        const ownershipQuery = `
            SELECT jp.job_id, jp.job_title, c.name AS company_name
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const ownershipResult = await client.query(ownershipQuery, [jobId, userId]);

        if (ownershipResult.rows.length === 0) {
            console.log('[CreateAndSchedule] Ownership check failed. jobId:', jobId, 'userId:', userId);
            return res.status(403).json({
                success: false,
                message: 'Access denied or job not found'
            });
        }

        await client.query('BEGIN');

        // Check if interview record already exists
        let interviewId;
        let channelName;
        const existingQuery = 'SELECT id, channel_name FROM interviews WHERE application_id = $1';
        const existing = await client.query(existingQuery, [applicationId]);

        if (existing.rows.length > 0) {
            interviewId = existing.rows[0].id;
            channelName = existing.rows[0].channel_name;
            console.log('[CreateAndSchedule] Using existing interview:', interviewId);
        } else {
            // Create interview record
            channelName = `interview_${applicationId}_${Date.now()}`;
            const insertQuery = `
                INSERT INTO interviews (
                    job_id, application_id, candidate_id, recruiter_id,
                    channel_name, status, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
                RETURNING id
            `;
            const insertResult = await client.query(insertQuery, [
                jobId, applicationId, candidateId, userId, channelName
            ]);
            interviewId = insertResult.rows[0].id;
            console.log('[CreateAndSchedule] Created new interview:', interviewId);
        }

        // Ensure channelName exists (handle legacy records where it might be null)
        if (!channelName) {
            channelName = `interview_${applicationId}_${Date.now()}`;
        }

        // Schedule the interview
        // Use explicit ISO timestamp if provided (for Start Now), otherwise construct from date/time strings
        const scheduledAt = req.body.scheduledAtISO || `${interviewDate} ${startTime}`;
        const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/${channelName}`;

        const updateQuery = `
            UPDATE interviews
            SET 
                interview_date = $1,
                start_time = $2,
                end_time = $3,
                scheduled_at = $4,
                meeting_link = $5,
                channel_name = $6,
                status = 'scheduled',
                recruiter_id = $8,
                updated_at = NOW()
            WHERE id = $7
            RETURNING id, interview_date, start_time, end_time, meeting_link, channel_name, status
        `;
        const result = await client.query(updateQuery, [
            interviewDate, startTime, endTime, scheduledAt, meetingLink, channelName, interviewId, userId
        ]);

        // Also update the application status to 'interview'
        await client.query(
            'UPDATE job_applications SET status = $1 WHERE id = $2',
            ['interview', applicationId]
        );

        await client.query('COMMIT');

        console.log('[CreateAndSchedule] Success! Interview', interviewId, 'scheduled. Data:', result.rows[0]);

        res.json({
            success: true,
            message: 'Interview created and scheduled successfully',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in create-and-schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create and schedule interview',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/interviews/auto-schedule
 * Automatically schedule interviews for all eligible candidates using Round-Robin algorithm
 * Accessible by: Recruiter only
 */
router.post('/auto-schedule', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const { jobId, config, interviewers } = req.body;

        if (!jobId || !config || !interviewers || !Array.isArray(interviewers)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: jobId, config, interviewers (array)'
            });
        }

        console.log('[Auto-Schedule] Request:', { jobId, config, interviewersCount: interviewers.length });

        // Verify recruiter owns the job
        const ownershipQuery = `
            SELECT jp.job_id
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const ownershipResult = await client.query(ownershipQuery, [jobId, userId]);
        if (ownershipResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied or job not found' });
        }

        // Fetch eligible candidates (status: pending, shortlisted_for_test, interview, applied)
        // Exclude rejected/hired/hired_candidate
        const candidatesQuery = `
            SELECT 
                ja.id as application_id, 
                c.id as candidate_id, 
                c.name as candidate_name, 
                c.email as candidate_email,
                c.user_id as candidate_user_id
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            WHERE ja.job_id = $1 
            AND ja.status NOT IN ('rejected', 'hired', 'hired_candidate')
            AND NOT EXISTS (
                SELECT 1 FROM interviews i 
                WHERE i.application_id = ja.id 
                AND i.status IN ('scheduled', 'completed')
            )
        `;
        const candidatesResult = await client.query(candidatesQuery, [jobId]);
        const candidates = candidatesResult.rows;

        if (candidates.length === 0) {
            return res.json({ success: true, message: 'No eligible candidates found for scheduling', data: [] });
        }

        console.log(`[Auto-Schedule] Found ${candidates.length} eligible candidates`);

        // Run Scheduling Algorithm
        const scheduledInterviews = scheduleInterviewsWithRoundRobin(candidates, interviewers, config);

        console.log(`[Auto-Schedule] Algorithm returned ${scheduledInterviews.length} schedules`);

        await client.query('BEGIN');

        const results = [];

        for (const interview of scheduledInterviews) {
            const { applicationId, candidateId, startTime, endTime, interviewDate } = interview;

            // Create channel name
            const channelName = `interview_${applicationId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/${channelName}`;
            const scheduledAt = `${interviewDate} ${startTime}`;

            // Check if interview record exists
            const existingQuery = 'SELECT id FROM interviews WHERE application_id = $1';
            const existingRes = await client.query(existingQuery, [applicationId]);

            let interviewId;

            if (existingRes.rows.length > 0) {
                // Update existing
                interviewId = existingRes.rows[0].id;
                const updateQuery = `
                    UPDATE interviews
                    SET 
                        interview_date = $1, start_time = $2, end_time = $3,
                        scheduled_at = $4, meeting_link = $5, channel_name = $6,
                        status = 'scheduled', updated_at = NOW(), recruiter_id = $7
                    WHERE id = $8
                    RETURNING id
                `;
                await client.query(updateQuery, [
                    interviewDate, startTime, endTime,
                    scheduledAt, meetingLink, channelName,
                    userId, interviewId
                ]);
            } else {
                // Insert new
                const insertQuery = `
                    INSERT INTO interviews (
                        job_id, application_id, candidate_id, recruiter_id,
                        channel_name, status, interview_date, start_time, end_time,
                        scheduled_at, meeting_link, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7, $8, $9, $10, NOW(), NOW())
                    RETURNING id
                `;
                const insertRes = await client.query(insertQuery, [
                    jobId, applicationId, candidateId, userId,
                    channelName, interviewDate, startTime, endTime,
                    scheduledAt, meetingLink
                ]);
                interviewId = insertRes.rows[0].id;
            }

            // Update application status
            await client.query(
                'UPDATE job_applications SET status = $1 WHERE id = $2',
                ['interview', applicationId]
            );

            results.push({ ...interview, interviewId });
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Successfully scheduled ${results.length} interviews`,
            data: results
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in auto-schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to auto-schedule interviews',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/interviews/schedule/:id
 * Schedule an interview (update date/time and change status to 'scheduled')
 * Accessible by: Recruiter only
 */
router.put('/schedule/:id', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const interviewId = req.params.id;
        const { interviewDate, startTime, endTime } = req.body;

        // Validation
        if (!interviewDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: interviewDate, startTime, endTime'
            });
        }

        // Verify ownership
        const ownershipQuery = `
            SELECT i.id, i.channel_name, i.candidate_id
            FROM interviews i
            WHERE i.id = $1 AND i.recruiter_id = $2
        `;
        const ownershipResult = await client.query(ownershipQuery, [interviewId, userId]);

        if (ownershipResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Interview not found or access denied'
            });
        }

        const { channel_name } = ownershipResult.rows[0];

        // Generate meeting link
        const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/${channel_name}`;

        // Combine date and time to create scheduled_at timestamp
        const scheduledAt = `${interviewDate} ${startTime}`;

        // Update interview
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE interviews
            SET 
                interview_date = $1,
                start_time = $2,
                end_time = $3,
                scheduled_at = $4,
                meeting_link = $5,
                status = 'scheduled',
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, interview_date, start_time, end_time, meeting_link, status
        `;

        const result = await client.query(updateQuery, [
            interviewDate,
            startTime,
            endTime,
            scheduledAt,
            meetingLink,
            interviewId
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Interview scheduled successfully',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error scheduling interview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule interview',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/interviews/send-email/:id
 * Send interview invitation email to candidate
 * Accessible by: Recruiter only
 */
router.post('/send-email/:id', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const interviewId = req.params.id;

        // Fetch interview details
        const query = `
            SELECT 
                i.id, i.interview_date, i.start_time, i.end_time, 
                i.meeting_link, i.email_sent, i.status,
                c.name as candidate_name, c.email as candidate_email,
                cr.name as recruiter_name,
                jp.job_title,
                comp.name AS company_name
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN credentials cr ON i.recruiter_id = cr.id
            JOIN job_postings jp ON i.job_id = jp.job_id
            JOIN companies comp ON jp.company_id = comp.id
            WHERE i.id = $1 AND i.recruiter_id = $2
        `;

        const result = await client.query(query, [interviewId, userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Interview not found or access denied'
            });
        }

        const interview = result.rows[0];

        // Check if interview is scheduled
        if (interview.status !== 'scheduled') {
            return res.status(400).json({
                success: false,
                message: 'Interview must be scheduled before sending email'
            });
        }

        // Format time
        const interviewTime = `${interview.start_time.substring(0, 5)} - ${interview.end_time.substring(0, 5)}`;

        // Send email
        const emailSent = await sendInterviewEmail(interview.candidate_email, {
            candidateName: interview.candidate_name,
            jobTitle: interview.job_title,
            companyName: interview.company_name,
            interviewDate: interview.interview_date,
            interviewTime: interviewTime,
            meetingLink: interview.meeting_link,
            recruiterName: interview.recruiter_name
        });

        // Update email_sent flag
        if (emailSent) {
            await client.query(
                'UPDATE interviews SET email_sent = true, updated_at = NOW() WHERE id = $1',
                [interviewId]
            );
        }

        res.json({
            success: emailSent,
            message: emailSent
                ? 'Interview invitation email sent successfully'
                : 'Email service not configured. Interview is scheduled but email was not sent.',
            data: {
                emailSent,
                candidateEmail: interview.candidate_email
            }
        });

    } catch (error) {
        console.error('Error sending interview email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send interview email',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/interviews/recruiter
 * Get all interviews for the logged-in recruiter
 * Accessible by: Recruiter only
 */
router.get('/recruiter', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        const query = `
            SELECT 
                i.id, i.interview_date, i.start_time, i.end_time,
                i.meeting_link, i.status, i.email_sent, i.channel_name,
                i.created_at, i.scheduled_at,
                c.name as candidate_name, c.email as candidate_email,
                c.resume_url,
                jp.job_title, jp.job_id,
                comp.name AS company_name,
                ja.match_score
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN job_postings jp ON i.job_id = jp.job_id
            JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN job_applications ja ON i.application_id = ja.id
            WHERE i.recruiter_id = $1
            ORDER BY 
                CASE 
                    WHEN i.status = 'pending' THEN 1
                    WHEN i.status = 'scheduled' THEN 2
                    WHEN i.status = 'completed' THEN 3
                    ELSE 4
                END,
                i.scheduled_at ASC NULLS LAST,
                i.created_at DESC
        `;

        const result = await pool.query(query, [userId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching recruiter interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interviews',
            error: error.message
        });
    }
});

/**
 * GET /api/interviews/candidate
 * Get all interviews for the logged-in candidate
 * Accessible by: Job Seeker only
 */
router.get('/candidate', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get candidate ID from user ID
        const candidateQuery = 'SELECT id FROM candidates WHERE user_id = $1';
        const candidateResult = await pool.query(candidateQuery, [userId]);

        if (candidateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidate profile not found'
            });
        }

        const candidateId = candidateResult.rows[0].id;

        const query = `
            SELECT 
                i.id, i.interview_date, i.start_time, i.end_time,
                i.meeting_link, i.status, i.channel_name,
                i.scheduled_at,
                jp.job_title, jp.job_id,
                comp.name AS company_name,
                cr.name as recruiter_name
            FROM interviews i
            JOIN job_postings jp ON i.job_id = jp.job_id
            JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN credentials cr ON i.recruiter_id = cr.id
            WHERE i.candidate_id = $1
            ORDER BY i.scheduled_at DESC NULLS LAST, i.created_at DESC
        `;

        const result = await pool.query(query, [candidateId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching candidate interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interviews',
            error: error.message
        });
    }
});

/**
 * POST /api/interviews/join
 * Generate Agora token for joining an interview
 * Accessible by: Both Recruiter and Candidate (if they belong to the interview)
 */
router.post('/join', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { channelName } = req.body;

        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: 'Channel name is required'
            });
        }

        // Verify user belongs to this interview
        let verificationQuery;
        let queryParams;

        if (userRole === 'recruiter') {
            verificationQuery = `
                SELECT i.id, i.status 
                FROM interviews i
                WHERE i.channel_name = $1 AND i.recruiter_id = $2
            `;
            queryParams = [channelName, userId];
        } else if (userRole === 'job_seeker') {
            // Get candidate ID first
            const candidateQuery = 'SELECT id FROM candidates WHERE user_id = $1';
            const candidateResult = await pool.query(candidateQuery, [userId]);

            if (candidateResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Candidate profile not found'
                });
            }

            const candidateId = candidateResult.rows[0].id;

            verificationQuery = `
                SELECT i.id, i.status 
                FROM interviews i
                WHERE i.channel_name = $1 AND i.candidate_id = $2
            `;
            queryParams = [channelName, candidateId];
        } else {
            return res.status(403).json({
                success: false,
                message: 'Invalid user role'
            });
        }

        const verificationResult = await pool.query(verificationQuery, queryParams);

        if (verificationResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this interview'
            });
        }

        const interview = verificationResult.rows[0];

        // Check if interview is scheduled or in progress
        if (interview.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This interview has been cancelled'
            });
        }

        // Generate Agora token
        const uid = 0; // 0 means Agora will auto-assign
        const role = 'publisher'; // Both users can publish (host mode)
        const token = generateAgoraToken(channelName, uid, role);

        res.json({
            success: true,
            data: {
                appId: process.env.AGORA_APP_ID,
                token: token,
                channelName: channelName,
                uid: uid
            }
        });

    } catch (error) {
        console.error('Error generating Agora token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate video token',
            error: error.message
        });
    }
});

/**
 * DELETE /api/interviews/:id
 * Cancel an interview
 * Accessible by: Recruiter only
 */
router.delete('/:id', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const interviewId = req.params.id;

        // Verify ownership
        const ownershipQuery = 'SELECT id FROM interviews WHERE id = $1 AND recruiter_id = $2';
        const ownershipResult = await client.query(ownershipQuery, [interviewId, userId]);

        if (ownershipResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Interview not found or access denied'
            });
        }

        // Update status to cancelled
        await client.query('BEGIN');

        await client.query(
            'UPDATE interviews SET status = $1, updated_at = NOW() WHERE id = $2',
            ['cancelled', interviewId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Interview cancelled successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelling interview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel interview',
            error: error.message
        });
    } finally {
        client.release();
    }
});

export default router;
