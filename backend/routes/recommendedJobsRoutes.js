import express from 'express';
import auth from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { getRecommendedJobs } from '../services/recommendedJobsService.js';

const router = express.Router();

// Rate limit: max 10 fetches per user per 10 minutes
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 requests per window
    message: { success: false, message: 'Too many job recommendation requests. Please try again later.' }
});

/**
 * @route GET /api/ai/recommended-jobs
 * @desc Get personalized job recommendations for the candidate
 * @access Private (Job Seeker)
 */
router.get('/', auth, limiter, async (req, res) => {
    try {
        console.log(`[RecommendedJobs] Request from UserID: ${req.user.userId}`);

        const jobs = await getRecommendedJobs(req.user.userId);

        res.json({
            success: true,
            data: jobs,
            count: jobs.length
        });
    } catch (error) {
        console.error('[RecommendedJobs Route Error]:', error);
        res.status(500).json({
            success: false,
            data: [],
            message: 'Failed to fetch job recommendations. Please try again.'
        });
    }
});

export default router;
