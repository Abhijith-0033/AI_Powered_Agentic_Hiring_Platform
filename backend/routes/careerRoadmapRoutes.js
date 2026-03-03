import express from 'express';
import { generateCareerRoadmap } from '../services/careerRoadmapService.js';
import auth from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 roadmaps per hour per IP
    message: { error: 'You have generated too many roadmaps. Please try again later.' }
});

/**
 * @route POST /api/career-roadmap/generate
 * @desc Generate a learning path for a specific skill
 * @access Private
 */
router.post('/generate', auth, limiter, async (req, res) => {
    try {
        const { skill, currentLevel } = req.body;

        if (!skill) {
            return res.status(400).json({ error: 'Target skill is required.' });
        }

        console.log(`[Roadmap] Generating for skill: ${skill}, level: ${currentLevel}`);

        const roadmapData = await generateCareerRoadmap(skill, currentLevel || 'Beginner');

        res.json({
            success: true,
            data: roadmapData
        });

    } catch (error) {
        console.error('Roadmap Route Error:', error);
        res.status(500).json({ error: 'Failed to generate roadmap. Please try again.' });
    }
});

export default router;
