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
        const { email } = req.user;

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id, experience_years, profile_description, skills, resume_url FROM candidates WHERE email = $1', [email]);

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }

        const candidate = candidateRes.rows[0];

        // Calculate Profile Completion
        let completionScore = 0;
        if (candidate.experience_years) completionScore += 20;
        if (candidate.profile_description) completionScore += 20;
        if (candidate.skills && candidate.skills.length > 0) completionScore += 20;
        if (candidate.resume_url) completionScore += 20;
        completionScore += 20; // Basic info

        // Matches: Approximate "matches" by finding jobs that have at least one of the user's skills
        let matchesCount = 0;
        if (candidate.skills && candidate.skills.length > 0) {
            // Very basic overlap check: count jobs where required_skills ILIKE any user skill
            // This is just to show *some* number if possible, or we just return 0 as "no matches generated".
            // Let's return 0 to be safe and "remove mock data" strictly (real data is 0 matches if no matching engine running).
            matchesCount = 0;
        }

        res.json({
            success: true,
            data: {
                applicationsSent: 0, // No table to track this yet
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

export default router;
