import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { createInterviewNotification } from '../services/notificationService.js';

const router = express.Router();

/**
 * POST /api/interviews/schedule/:jobId
 * Schedule interviews for top 10 AI-ranked candidates
 * STRICT: Only for candidates with AI Auto Shortlist scores
 */
router.post('/schedule/:jobId', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { jobId } = req.params;
        const userId = req.user.userId;
        const { interviewDate, startTime, slotDuration, mode, meetingLink } = req.body;

        console.log(`[Interview Scheduler] Request for Job ID ${jobId} by User ${userId}`);

        // 1. Verify Ownership
        const ownershipQuery = `
            SELECT jp.job_title
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

        const jobTitle = ownershipResult.rows[0].job_title;

        // 2. Fetch Top 10 Candidates from Auto Shortlist (STRICT: Only AI-scored candidates)
        const candidatesQuery = `
            SELECT 
                ja.id as application_id,
                ja.candidate_id,
                ja.match_score,
                c.name as candidate_name,
                c.email as candidate_email,
                c.user_id as candidate_user_id
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            WHERE ja.job_id = $1 
                AND ja.match_score IS NOT NULL 
                AND ja.shortlisted_by_ai = true
            ORDER BY ja.match_score DESC
            LIMIT 10
        `;

        const candidatesResult = await client.query(candidatesQuery, [jobId]);

        if (candidatesResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No AI-ranked candidates found. Please run Auto Shortlist first.'
            });
        }

        const topCandidates = candidatesResult.rows;
        console.log(`[Interview Scheduler] Found ${topCandidates.length} top candidates`);

        // 3. Calculate sequential time slots
        const interviews = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);

        for (let i = 0; i < topCandidates.length; i++) {
            const candidate = topCandidates[i];

            // Calculate this candidate's slot
            const slotStartMinutes = startHour * 60 + startMinute + (i * slotDuration);
            const slotEndMinutes = slotStartMinutes + slotDuration;

            const slotStartTime = `${String(Math.floor(slotStartMinutes / 60)).padStart(2, '0')}:${String(slotStartMinutes % 60).padStart(2, '0')}`;
            const slotEndTime = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

            interviews.push({
                applicationId: candidate.application_id,
                candidateId: candidate.candidate_id,
                candidateName: candidate.candidate_name,
                candidateUserId: candidate.candidate_user_id,
                startTime: slotStartTime,
                endTime: slotEndTime
            });
        }

        // 4. Insert Interviews into Database
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO interviews 
                (job_id, application_id, candidate_id, interview_date, start_time, end_time, mode, meeting_link, created_by)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;

        const scheduledInterviews = [];

        for (const interview of interviews) {
            const values = [
                jobId,
                interview.applicationId,
                interview.candidateId,
                interviewDate,
                interview.startTime,
                interview.endTime,
                mode,
                meetingLink || null,
                userId
            ];

            const insertResult = await client.query(insertQuery, values);
            const interviewId = insertResult.rows[0].id;

            scheduledInterviews.push({
                interviewId,
                candidateName: interview.candidateName,
                timeSlot: `${interview.startTime} - ${interview.endTime}`
            });

            // 5. Create Notification for Candidate
            if (interview.candidateUserId) {
                await createInterviewNotification(interview.candidateUserId, {
                    jobTitle,
                    interviewDate,
                    startTime: interview.startTime,
                    endTime: interview.endTime,
                    mode,
                    meetingLink: meetingLink || null
                });
            }
        }

        await client.query('COMMIT');

        console.log(`[Interview Scheduler] Successfully scheduled ${scheduledInterviews.length} interviews`);

        res.json({
            success: true,
            message: `Successfully scheduled ${scheduledInterviews.length} interviews`,
            data: {
                jobTitle,
                interviewDate,
                mode,
                meetingLink: meetingLink || null,
                scheduledInterviews
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error scheduling interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule interviews',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/interviews/job/:jobId
 * Fetch scheduled interviews for a job (optional, for future use)
 */
router.get('/job/:jobId', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.userId;

        // Verify ownership
        const ownershipQuery = `
            SELECT 1
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const ownershipResult = await pool.query(ownershipQuery, [jobId, userId]);

        if (ownershipResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied or job not found'
            });
        }

        // Fetch interviews
        const interviewsQuery = `
            SELECT 
                i.id,
                i.interview_date,
                i.start_time,
                i.end_time,
                i.mode,
                i.meeting_link,
                i.status,
                c.name as candidate_name,
                c.email as candidate_email,
                ja.match_score
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN job_applications ja ON i.application_id = ja.id
            WHERE i.job_id = $1
            ORDER BY i.interview_date, i.start_time
        `;

        const result = await pool.query(interviewsQuery, [jobId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
