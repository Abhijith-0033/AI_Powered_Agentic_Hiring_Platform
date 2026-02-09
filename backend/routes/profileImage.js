import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js'; // Assuming auth middleware exists

const router = express.Router();

/**
 * @route   GET /api/profile-image
 * @desc    Get current user's profile image
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            console.error('[PROFILE_IMAGE] No userId in request');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 1. Get candidate ID
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            // Log this info scenario
            console.log(`[PROFILE_IMAGE] No candidate found for user ${userId}`);
            return res.status(404).json({ message: 'Candidate profile not found' });
        }

        const candidateId = candidateRes.rows[0].id;

        // 2. Get image from new table
        const result = await pool.query(
            'SELECT image_data, image_type FROM job_seeker_profile_image WHERE job_seeker_id = $1',
            [candidateId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No profile image found' });
        }

        const { image_data, image_type } = result.rows[0];

        // 3. Send image data
        if (!image_data) {
            console.error('[PROFILE_IMAGE] Image data is null/empty for candidate', candidateId);
            return res.status(404).json({ message: 'Image data empty' });
        }

        res.set('Content-Type', image_type || 'image/png');
        res.send(image_data);

    } catch (error) {
        console.error('Error fetching profile image:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

/**
 * @route   POST /api/profile-image
 * @desc    Upload or update profile image
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const { image_data, image_type } = req.body; // Expecting base64 string and type from frontend?
        // Wait, if frontend sends file, we usually use multer. But user request allows "image_url or storage path / base64 reference".
        // The implementation plan says "storing as Base64 text for simplicity" OR "BYTEA".
        // My migration made BYTEA.
        // So I should expect Base64 string in body, decode it to buffer, and store.

        if (!image_data || !image_type) {
            return res.status(400).json({ message: 'Please provide image data and type' });
        }

        // 1. Get candidate ID
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [req.user.userId]
        );

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ message: 'Candidate profile not found' });
        }

        const candidateId = candidateRes.rows[0].id;

        // Convert Base64 to Buffer
        const imageBuffer = Buffer.from(image_data, 'base64');

        // 2. Upsert image (Replace if exists)
        await pool.query(`
            INSERT INTO job_seeker_profile_image (job_seeker_id, image_data, image_type, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (job_seeker_id) 
            DO UPDATE SET 
                image_data = EXCLUDED.image_data,
                image_type = EXCLUDED.image_type,
                updated_at = NOW()
        `, [candidateId, imageBuffer, image_type]);

        res.json({ message: 'Profile image updated successfully' });

    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/profile-image
 * @desc    Delete profile image
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
    try {
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [req.user.userId]
        );

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ message: 'Candidate profile not found' });
        }

        const candidateId = candidateRes.rows[0].id;

        await pool.query(
            'DELETE FROM job_seeker_profile_image WHERE job_seeker_id = $1',
            [candidateId]
        );

        res.json({ message: 'Profile image deleted successfully' });

    } catch (error) {
        console.error('Error deleting profile image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
