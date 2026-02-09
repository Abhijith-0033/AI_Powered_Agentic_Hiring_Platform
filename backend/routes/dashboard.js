import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Returns dashboard metrics for the logged-in user
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const { userId, email } = req.user;

        // Use user_id for robust lookup of candidate profile
        const candidateRes = await pool.query('SELECT id, experience_years, profile_description, skills, resume_url FROM candidates WHERE user_id = $1', [userId]);

        if (candidateRes.rows.length === 0) {
            // New user or no profile created yet: return zero stats instead of 404 to avoid dashboard crash
            return res.json({
                success: true,
                data: {
                    applicationsSent: 0,
                    matchesFound: 0,
                    profileViews: 0,
                    interviewsScheduled: 0,
                    profileCompletion: 0 // Prompt user to complete profile
                }
            });
        }

        const candidate = candidateRes.rows[0];

        // Calculate Profile Completion
        let completionScore = 0;
        if (candidate.experience_years) completionScore += 20;
        if (candidate.profile_description) completionScore += 20;
        if (candidate.skills && candidate.skills.length > 0) completionScore += 20;
        // Resume check (resume_url might be null if using blob, check blob table if needed, but keeping simple)
        if (candidate.resume_url) completionScore += 20;
        completionScore += 20; // Basic info

        // Matches: Approximate "matches" by finding jobs that have at least one of the user's skills
        let matchesCount = 0;
        if (candidate.skills && candidate.skills.length > 0) {
            matchesCount = 0; // Keeping 0 as placeholder for now
        }

        // Calculate Applications Sent
        const appsRes = await pool.query('SELECT COUNT(*) FROM job_applications WHERE candidate_id = $1', [candidate.id]);
        const appsCount = parseInt(appsRes.rows[0].count);
        console.log(`[Dashboard] User ${email} (Candidate ID: ${candidate.id}) - Applications found: ${appsCount}`);

        res.json({
            success: true,
            data: {
                applicationsSent: appsCount,
                matchesFound: matchesCount,
                profileViews: 0,
                interviewsScheduled: 0,
                profileCompletion: completionScore
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/dashboard/activity
 * Returns recent activity for the logged-in user
 */
router.get('/activity', auth, async (req, res) => {
    // Return empty list as we don't have activity tracking
    res.json({ success: true, data: [] });
});

/**
 * GET /api/dashboard/provider/stats
 * Returns dashboard data for the logged-in RECRUITER
 */
router.get('/provider/stats', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Fetch Company Details
        const companyQuery = `
            SELECT id, name, logo, location, industry, website_url 
            FROM companies 
            WHERE created_by = $1
        `;
        const { rows: companyRows } = await pool.query(companyQuery, [userId]);
        const company = companyRows[0] || null;

        let stats = {
            jobsPosted: 0,
            applicants: 0, // Mocked as 0 for now as table missing
            shortlisted: 0,
            interviewed: 0
        };
        let recentJobs = [];

        if (company) {
            if (company.logo) {
                company.logo = `data:image/jpeg;base64,${company.logo.toString('base64')}`;
            }

            // 1. Jobs Posted count
            const jobsCountRes = await pool.query('SELECT COUNT(*) FROM job_postings WHERE company_id = $1', [company.id]);
            stats.jobsPosted = parseInt(jobsCountRes.rows[0].count);

            // 2. Applicants count
            const appsCountQuery = `
                SELECT COUNT(ja.id) 
                FROM job_applications ja
                JOIN job_postings jp ON ja.job_id = jp.job_id
                WHERE jp.company_id = $1
            `;
            const appsCountRes = await pool.query(appsCountQuery, [company.id]);
            stats.applicants = parseInt(appsCountRes.rows[0].count);

            // 3. Recent Jobs
            const recentJobsQuery = `
                SELECT job_id, job_title, status, created_at,
                       (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.job_id) as applicant_count
                FROM job_postings jp
                WHERE company_id = $1
                ORDER BY created_at DESC
                LIMIT 5
            `;
            const { rows: jobsRows } = await pool.query(recentJobsQuery, [company.id]);
            recentJobs = jobsRows;
        }

        res.json({
            success: true,
            company: company,
            user: { email: req.user.email },
            stats,
            recentJobs
        });

    } catch (error) {
        console.error('Error fetching provider stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
