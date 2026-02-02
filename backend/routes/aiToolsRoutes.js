import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { rankCandidates } from '../services/aiShortlistService.js';

const router = express.Router();

/**
 * GET /api/ai-tools/jobs
 * Fetch jobs posted by the logged-in recruiter (for dropdown)
 * Isolated from the main job feed to ensure safety.
 */
router.get('/jobs', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        const query = `
            SELECT 
                jp.job_id, 
                jp.job_title, 
                jp.location, 
                jp.job_type, 
                jp.status,
                COUNT(ja.id) as applicant_count
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            LEFT JOIN job_applications ja ON jp.job_id = ja.job_id
            WHERE c.created_by = $1
            GROUP BY jp.job_id, jp.job_title, jp.location, jp.job_type, jp.status
            ORDER BY jp.created_at DESC
        `;

        const { rows } = await pool.query(query, [userId]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching recruiter jobs for AI tools:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/ai-tools/jobs/:jobId/candidates
 * Read-only view of candidates for a specific job
 */
router.get('/jobs/:jobId/candidates', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.userId;

        // 1. Verify Ownership
        const checkQuery = `
            SELECT 1 FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const checkResult = await pool.query(checkQuery, [jobId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied or job not found' });
        }

        // 2. Fetch Candidates
        const query = `
            SELECT 
                ja.id as application_id,
                ja.status,
                ja.match_score,
                ja.shortlisted_by_ai,
                c.name as candidate_name,
                c.email as candidate_email,
                COALESCE(ja.resume_name, cr.resume_name, 'Resume.pdf') as resume_name,
                ja.resume_data,            -- Select individually
                cr.file_url,               -- Select individually
                c.resume_pdf               -- Select individually (Bytea)
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            LEFT JOIN candidate_resumes cr ON ja.resume_id = cr.id
            WHERE ja.job_id = $1
            ORDER BY 
                CASE WHEN ja.match_score IS NOT NULL THEN 0 ELSE 1 END, 
                ja.match_score DESC,
                ja.id ASC
        `;

        const { rows } = await pool.query(query, [jobId]);

        // Fix Resume Availability Flag in JS (mirroring the logic used in POST)
        const candidates = rows.map(row => {
            const hasData = !!(row.resume_data || row.file_url || row.resume_pdf);
            // We can also assume if ai_shortlisted is true and match_score > 0, we had something.
            // But strict check:
            const { resume_data, file_url, resume_pdf, ...safeRow } = row;
            return {
                ...safeRow,
                has_resume: hasData
            };
        });

        res.json({
            success: true,
            data: candidates
        });

    } catch (error) {
        console.error('Error fetching candidates for AI tools:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/ai-tools/shortlist/:jobId
 * Trigger AI Auto-Shortlist logic
 */
router.post('/shortlist/:jobId', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { jobId } = req.params;
        const userId = req.user.userId;

        console.log(`[AI Trigger] Auto-Shortlist requested for Job ID ${jobId} by User ${userId}`);

        // 1. Verify Ownership & Fetch Job Description
        const jobQuery = `
            SELECT 
                jp.job_description,
                jp.required_skills,
                jp.required_education
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const jobResult = await client.query(jobQuery, [jobId, userId]);

        if (jobResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied or job not found' });
        }

        const { job_description, required_skills, required_education } = jobResult.rows[0];

        // Concatenate job criteria
        const jobContext = [
            job_description,
            required_skills ? `Required Skills: ${required_skills}` : null,
            required_education ? `Required Education: ${required_education}` : null
        ].filter(Boolean).join('\n\n');

        console.log(`[AI Context] Job Context Length: ${jobContext.length}`);

        // 2. Fetch All Applications with Resume Data
        const appsQuery = `
            SELECT 
                ja.id as application_id,
                ja.resume_data,
                cr.file_url,
                c.resume_pdf,
                COALESCE(ja.resume_name, cr.resume_name, 'Resume.pdf') as resume_name,
                c.skills,
                c.degree,
                c.institution
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            LEFT JOIN candidate_resumes cr ON ja.resume_id = cr.id
            WHERE ja.job_id = $1
        `;
        const appsResult = await client.query(appsQuery, [jobId]);

        // Fix COALESCE type error (TEXT vs BYTEA) by handling in JS
        const applications = appsResult.rows.map(app => {
            let data = app.resume_data || app.file_url;
            if (!data && app.resume_pdf) {
                // app.resume_pdf is a Buffer (BYTEA), convert to Base64 String
                data = app.resume_pdf.toString('base64');
            }
            return {
                ...app,
                resume_data: data
            };
        });

        if (applications.length === 0) {
            return res.status(400).json({ success: false, message: 'No applicants to shortlist' });
        }

        // 3. Run AI Logic (Service Layer)
        // This might take time, but for <100 resumes it's acceptable to likely await.
        // For larger scale, we'd use a job queue, but strict requirements denote simpler implementation.
        const jobMetadata = { required_skills, required_education };
        const results = await rankCandidates(jobContext, applications, jobMetadata);

        // 4. Update Database safely
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE job_applications 
            SET match_score = $1, shortlisted_by_ai = true
            WHERE id = $2
        `;

        for (const res of results) {
            await client.query(updateQuery, [res.match_score, res.application_id]);
        }

        await client.query('COMMIT');

        console.log(`[AI Trigger] Completed. Updates: ${results.length}`);

        res.json({
            success: true,
            message: `Successfully ranked ${results.length} candidates`,
            data: results
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error running auto-shortlist:', error);
        // Do NOT return 500. Return success: false but with 200 status so UI doesn't crash?
        // Or return success: true with warning? 
        // User requested: "The endpoint must always return a successful response: { matchScore: 0, ... }"
        // But we might not have list of candidates if it crashed early.
        // Best effort:
        res.status(200).json({
            success: false,
            message: 'AI processing encountered an issue but system preserved state.',
            error: error.message
        });
    } finally {
        client.release();
    }
});

export default router;
