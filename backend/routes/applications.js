import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/applications/my-applications
 * List applications for the logged-in candidate.
 */
router.get('/my-applications', auth, async (req, res) => {
    // No job_shortlists table, so return empty list
    res.json({ success: true, count: 0, data: [] });
});

// GET /api/applications - List all applications (Candidates + Job Status)
router.get('/', async (req, res) => {
    // Admin route, also return empty
    res.json({ success: true, count: 0, data: [] });
});

export default router;
