
import express from 'express';
import { generateCoverLetter } from '../services/aiCoverLetterService.js';
import auth from '../middleware/auth.js'; // fixed import (default export)
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate Limiter: 5 requests per hour
const generateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Rate limit exceeded. You can generate 5 cover letters per hour.' }
});

/**
 * POST /api/ai/cover-letter/generate
 * Generates a cover letter based on Job and Candidate Profile
 */
// Role guard middleware (inline for now as it wasn't exported from auth.js)
const roleGuard = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) next();
    else res.status(403).json({ success: false, message: 'Forbidden' });
};

router.post('/generate', auth, roleGuard('job_seeker'), generateLimiter, async (req, res) => {
    const { jobId, tone } = req.body;
    const userId = req.user.userId; // Fixed: req.user.userId based on auth.js

    if (!jobId) {
        return res.status(400).json({ success: false, message: 'Job ID is required' });
    }

    try {
        console.log(`🚀 Generating Cover Letter for User ${userId} applying to Job ${jobId}`);

        const result = await generateCoverLetter(userId, jobId, tone);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate cover letter'
        });
    }
});

export default router;
