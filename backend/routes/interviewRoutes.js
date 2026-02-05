import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { createInterviewNotification } from '../services/notificationService.js';
import { scheduleInterviewsWithRoundRobin, scheduleInterviewsSequential } from '../services/schedulingAlgorithm.js';

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

        // Extract request parameters
        const { interviewers = [], breakDuration = 15, breakFrequency = 3 } = req.body;

        // 3. Schedule interviews using algorithm
        let scheduledSlots;

        if (interviewers && interviewers.length > 0) {
            // Use Break-Aware Round-Robin Algorithm
            console.log(`[Interview Scheduler] Using Round-Robin algorithm with ${interviewers.length} interviewers`);
            scheduledSlots = scheduleInterviewsWithRoundRobin(topCandidates, interviewers, {
                startTime,
                slotDuration,
                breakDuration,
                breakFrequency,
                interviewDate
            });
        } else {
            // Fallback to sequential scheduling (backward compatibility)
            console.log('[Interview Scheduler] No interviewers provided, using sequential mode');
            scheduledSlots = scheduleInterviewsSequential(topCandidates, {
                startTime,
                slotDuration,
                interviewDate
            });
        }

        // 4. Insert Interviews into Database
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO interviews 
                (job_id, application_id, candidate_id, interview_date, start_time, end_time, mode, meeting_link, 
                 interviewer_name, interviewer_email, interviewer_index, created_by)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;

        const scheduledInterviews = [];

        for (const slot of scheduledSlots) {
            const values = [
                jobId,
                slot.applicationId,
                slot.candidateId,
                interviewDate,
                slot.startTime,
                slot.endTime,
                mode,
                meetingLink || null,
                slot.interviewerName,
                slot.interviewerEmail,
                slot.interviewerIndex,
                userId
            ];

            const insertResult = await client.query(insertQuery, values);
            const interviewId = insertResult.rows[0].id;

            scheduledInterviews.push({
                interviewId,
                candidateName: slot.candidateName,
                timeSlot: `${slot.startTime} - ${slot.endTime}`,
                interviewerName: slot.interviewerName || 'Not assigned'
            });

            // 5. Create Notification for Candidate
            if (slot.candidateUserId) {
                await createInterviewNotification(slot.candidateUserId, {
                    jobTitle,
                    interviewDate,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    mode,
                    meetingLink: meetingLink || null,
                    interviewerName: slot.interviewerName
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
