import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/candidate/resumes
 * Fetch all resumes for authenticated user
 */
router.get('/resumes', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(`[Resumes] Fetching all resumes for user ${userId}`);

        // Get candidate_id from user_id
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            console.log(`[Resumes] No candidate profile found for user ${userId}`);
            return res.json({
                success: true,
                data: [],
                count: 0
            });
        }

        const candidateId = candidateRes.rows[0].id;

        // Fetch all resumes for this candidate
        const resumesRes = await pool.query(`
            SELECT 
                id,
                resume_name,
                file_size_kb,
                mime_type,
                is_default,
                created_at,
                updated_at
            FROM candidate_resumes
            WHERE candidate_id = $1
            ORDER BY created_at DESC
        `, [candidateId]);

        console.log(`[Resumes] Found ${resumesRes.rows.length} resumes`);

        res.json({
            success: true,
            data: resumesRes.rows,
            count: resumesRes.rows.length
        });

    } catch (error) {
        console.error('[Resumes] Error fetching resumes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resumes',
            error: error.message
        });
    }
});

/**
 * POST /api/candidate/resumes
 * Upload new resume (max 5 per user)
 * Query param: syncProfile=true to also update candidates.resume_url
 */
router.post('/resumes', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const { resume_name, file_data } = req.body;

        console.log(`[Resume Upload] User ${userId} uploading resume: ${resume_name}`);

        // Validate input
        if (!resume_name || !file_data) {
            return res.status(400).json({
                success: false,
                message: 'resume_name and file_data are required'
            });
        }

        // Get candidate_id from user_id
        const candidateRes = await pool.query(
            'SELECT id, name, email FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            // Auto-create candidate profile if doesn't exist
            const credRes = await pool.query(
                'SELECT name, email FROM credentials WHERE id = $1',
                [userId]
            );

            if (credRes.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const { name, email } = credRes.rows[0];
            const createRes = await pool.query(`
                INSERT INTO candidates (user_id, name, email, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING id
            `, [userId, name, email]);

            candidateRes.rows[0] = { id: createRes.rows[0].id };
            console.log(`[Resume Upload] Auto-created candidate profile for user ${userId}`);
        }

        const candidateId = candidateRes.rows[0].id;

        // Check resume count (max 5)
        const countRes = await pool.query(
            'SELECT COUNT(*) FROM candidate_resumes WHERE candidate_id = $1',
            [candidateId]
        );

        const currentCount = parseInt(countRes.rows[0].count);
        if (currentCount >= 5) {
            console.log(`[Resume Upload] User ${userId} has reached max resume limit (${currentCount})`);
            return res.status(400).json({
                success: false,
                message: 'You can upload a maximum of 5 resumes. Please delete an existing resume before uploading a new one.'
            });
        }

        // Process file data
        let pdfBuffer;
        let mimeType = 'application/pdf';

        try {
            // Check if it has data URI prefix and extract MIME type
            const matches = file_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

            if (matches && matches.length === 3) {
                mimeType = matches[1];
                pdfBuffer = Buffer.from(matches[2], 'base64');
            } else {
                // Assume raw base64 string
                pdfBuffer = Buffer.from(file_data, 'base64');
            }
        } catch (e) {
            console.error('[Resume Upload] Error converting base64:', e);
            return res.status(400).json({
                success: false,
                message: 'Invalid file format'
            });
        }

        // Validate MIME type
        if (mimeType !== 'application/pdf') {
            return res.status(400).json({
                success: false,
                message: 'Only PDF files are allowed'
            });
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (pdfBuffer.length > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'Resume file size must be less than 10MB'
            });
        }

        const fileSizeKb = Math.ceil(pdfBuffer.length / 1024);
        console.log(`[Resume Upload] File size: ${fileSizeKb} KB`);

        await client.query('BEGIN');

        // Check if this upload should sync with profile (from query param)
        const syncProfile = req.query.syncProfile === 'true';

        // Determine if this should be the default resume
        const isFirstResume = currentCount === 0;
        const isDefault = syncProfile || isFirstResume; // sync from profile = always default

        // If setting as default, clear existing default flags
        if (isDefault) {
            await client.query(
                'UPDATE candidate_resumes SET is_default = FALSE WHERE candidate_id = $1',
                [candidateId]
            );
        }

        // Insert new resume
        const insertRes = await client.query(`
            INSERT INTO candidate_resumes 
                (candidate_id, resume_name, file_url, file_size_kb, mime_type, is_default, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING id, resume_name, file_size_kb, mime_type, is_default, created_at
        `, [candidateId, resume_name, file_data, fileSizeKb, mimeType, isDefault]);

        const newResume = insertRes.rows[0];

        // If syncProfile=true, also update candidates.resume_pdf
        if (syncProfile) {
            console.log(`[Resume Upload] Syncing with profile - updating candidates.resume_pdf`);
            await client.query(
                'UPDATE candidates SET resume_pdf = $1, updated_at = NOW() WHERE id = $2',
                [file_data, candidateId]
            );
        }

        await client.query('COMMIT');

        console.log(`[Resume Upload] Successfully uploaded resume ${newResume.id}`);

        res.status(201).json({
            success: true,
            message: 'Resume uploaded successfully',
            data: newResume
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Resume Upload] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload resume',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/candidate/resumes/:id
 * Fetch specific resume PDF by ID
 */
router.get('/resumes/:id', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const resumeId = req.params.id;

        console.log(`[Resume Fetch] User ${userId} requesting resume ${resumeId}`);

        // Get candidate_id from user_id
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidate profile not found'
            });
        }

        const candidateId = candidateRes.rows[0].id;

        // Fetch resume and verify ownership
        const resumeRes = await pool.query(`
            SELECT file_url, resume_name, mime_type
            FROM candidate_resumes
            WHERE id = $1 AND candidate_id = $2
        `, [resumeId, candidateId]);

        if (resumeRes.rows.length === 0) {
            console.log(`[Resume Fetch] Resume ${resumeId} not found or access denied`);
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }

        const { file_url, resume_name, mime_type } = resumeRes.rows[0];

        // Convert base64 to buffer
        let pdfBuffer;
        try {
            const matches = file_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                pdfBuffer = Buffer.from(matches[2], 'base64');
            } else {
                pdfBuffer = Buffer.from(file_url, 'base64');
            }
        } catch (e) {
            console.error('[Resume Fetch] Error converting base64:', e);
            return res.status(500).json({
                success: false,
                message: 'Failed to process resume data'
            });
        }

        // Send PDF
        res.setHeader('Content-Type', mime_type || 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${resume_name}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        console.log(`[Resume Fetch] Streaming PDF to client (${pdfBuffer.length} bytes)`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('[Resume Fetch] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume',
            error: error.message
        });
    }
});

/**
 * DELETE /api/candidate/resumes/:id
 * Delete a specific resume
 */
router.delete('/resumes/:id', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const resumeId = req.params.id;

        console.log(`[Resume Delete] User ${userId} deleting resume ${resumeId}`);

        // Get candidate_id from user_id
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidate profile not found'
            });
        }

        const candidateId = candidateRes.rows[0].id;

        await client.query('BEGIN');

        // Verify ownership and delete
        const deleteRes = await client.query(`
            DELETE FROM candidate_resumes
            WHERE id = $1 AND candidate_id = $2
            RETURNING id, resume_name
        `, [resumeId, candidateId]);

        if (deleteRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }

        await client.query('COMMIT');

        console.log(`[Resume Delete] Successfully deleted resume ${resumeId}`);

        res.json({
            success: true,
            message: 'Resume deleted successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Resume Delete] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete resume',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PATCH /api/candidate/resumes/:id/set-default
 * Set a resume as the default and sync with profile
 */
router.patch('/resumes/:id/set-default', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const resumeId = req.params.id;

        console.log(`[Set Default] User ${userId} setting resume ${resumeId} as default`);

        // Get candidate_id from user_id
        const candidateRes = await pool.query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidate profile not found'
            });
        }

        const candidateId = candidateRes.rows[0].id;

        await client.query('BEGIN');

        // Verify the resume exists and get its file_url
        const resumeRes = await client.query(
            'SELECT file_url, resume_name FROM candidate_resumes WHERE id = $1 AND candidate_id = $2',
            [resumeId, candidateId]
        );

        if (resumeRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }

        const { file_url, resume_name } = resumeRes.rows[0];

        // Clear all existing default flags
        await client.query(
            'UPDATE candidate_resumes SET is_default = FALSE WHERE candidate_id = $1',
            [candidateId]
        );

        // Set this resume as default
        await client.query(
            'UPDATE candidate_resumes SET is_default = TRUE WHERE id = $1',
            [resumeId]
        );

        // Sync with candidates table (set as profile resume)
        await client.query(
            'UPDATE candidates SET resume_pdf = $1, updated_at = NOW() WHERE id = $2',
            [file_url, candidateId]
        );

        await client.query('COMMIT');

        console.log(`[Set Default] Resume ${resumeId} set as default and synced with profile`);

        res.json({
            success: true,
            message: `${resume_name} set as default resume`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Set Default] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set default resume',
            error: error.message
        });
    } finally {
        client.release();
    }
});

export default router;
