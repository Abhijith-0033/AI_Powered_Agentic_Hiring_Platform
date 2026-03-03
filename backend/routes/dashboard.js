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
        let completionScore = 20; // 20% Base score for basic info / account creation

        if (candidate.profile_description && candidate.profile_description.trim().length > 0) {
            completionScore += 20;
        }

        if (candidate.skills && candidate.skills.length > 0) {
            completionScore += 20;
        }

        // Check if they have added education OR experience
        const expCheck = await pool.query('SELECT 1 FROM candidate_experience WHERE candidate_id = $1 LIMIT 1', [candidate.id]);
        const eduCheck = await pool.query('SELECT 1 FROM candidate_education WHERE candidate_id = $1 LIMIT 1', [candidate.id]);
        if (expCheck.rows.length > 0 || eduCheck.rows.length > 0) {
            completionScore += 20;
        }

        // Check if they have uploaded a resume
        const resumeCheck = await pool.query('SELECT 1 FROM candidate_resumes WHERE candidate_id = $1 LIMIT 1', [candidate.id]);
        if (resumeCheck.rows.length > 0 || candidate.resume_url) {
            completionScore += 20;
        }

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
            applicants: 0,
            shortlisted: 0,
            interviewed: 0
        };
        let recentJobs = [];
        let jobsPostedData = [];
        let applicationTrendData = [];

        if (company) {
            if (company.logo) {
                company.logo = `data:image/jpeg;base64,${company.logo.toString('base64')}`;
            }

            // 1. Jobs Posted count
            const jobsCountRes = await pool.query('SELECT COUNT(*) FROM job_postings WHERE company_id = $1', [company.id]);
            stats.jobsPosted = parseInt(jobsCountRes.rows[0].count);

            // 2. Applicants count
            const appsCountQuery = `
                SELECT COUNT(ja.id) as total,
                       SUM(CASE WHEN ja.status IN ('shortlisted', 'shortlisted_for_test') THEN 1 ELSE 0 END) as shortlisted_count,
                       SUM(CASE WHEN ja.status = 'interview' THEN 1 ELSE 0 END) as interviewed_count
                FROM job_applications ja
                JOIN job_postings jp ON ja.job_id = jp.job_id
                WHERE jp.company_id = $1
            `;
            const appsCountRes = await pool.query(appsCountQuery, [company.id]);
            stats.applicants = parseInt(appsCountRes.rows[0].total) || 0;
            stats.shortlisted = parseInt(appsCountRes.rows[0].shortlisted_count) || 0;
            stats.interviewed = parseInt(appsCountRes.rows[0].interviewed_count) || 0;

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

            // 4. Jobs Posted Data (Last 6 Months)
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                jobsPostedData.push({
                    name: d.toLocaleString('en-US', { month: 'short' }),
                    jobs: 0,
                    month: d.getMonth() + 1,
                    year: d.getFullYear()
                });
            }

            const jobsCountResByMonth = await pool.query(`
                SELECT EXTRACT(MONTH FROM created_at) as month, EXTRACT(YEAR FROM created_at) as year, COUNT(*) as count 
                FROM job_postings 
                WHERE company_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
                GROUP BY EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at)
            `, [company.id]);

            jobsCountResByMonth.rows.forEach(row => {
                const item = jobsPostedData.find(d => d.month === parseInt(row.month) && d.year === parseInt(row.year));
                if (item) item.jobs = parseInt(row.count);
            });

            // 5. Application Trends Data (Last 7 Days)
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                applicationTrendData.push({
                    name: d.toLocaleString('en-US', { weekday: 'short' }),
                    apps: 0,
                    dateStr: d.toISOString().split('T')[0]
                });
            }

            const appsTrendRes = await pool.query(`
                SELECT TO_CHAR(ja.applied_at, 'YYYY-MM-DD') as date_str, COUNT(*) as count
                FROM job_applications ja
                JOIN job_postings jp ON ja.job_id = jp.job_id
                WHERE jp.company_id = $1 AND ja.applied_at >= NOW() - INTERVAL '7 days'
                GROUP BY TO_CHAR(ja.applied_at, 'YYYY-MM-DD')
            `, [company.id]);

            appsTrendRes.rows.forEach(row => {
                const item = applicationTrendData.find(d => d.dateStr === row.date_str);
                if (item) item.apps = parseInt(row.count);
            });
        }

        res.json({
            success: true,
            company: company,
            user: { email: req.user.email },
            stats,
            recentJobs,
            jobsPostedData,
            applicationTrendData
        });

    } catch (error) {
        console.error('Error fetching provider stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
