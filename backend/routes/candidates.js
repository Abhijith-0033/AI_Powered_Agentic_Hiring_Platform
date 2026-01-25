import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/candidates/profile
// Save/Update Candidate Profile (Single Table)
router.post('/profile', auth, async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('[Profile Update] ========== START ===========');
        console.log('[Profile Update] User ID:', req.user.userId);
        console.log('[Profile Update] Request body keys:', Object.keys(req.body));

        const {
            personal_info,
            experience,
            education
        } = req.body;

        const userId = req.user.userId;

        // Basic Validation
        if (!personal_info) {
            console.log('[Profile Update] ERROR: Missing personal_info');
            return res.status(400).json({ success: false, message: 'Personal info is required' });
        }
        if (!personal_info.name) {
            console.log('[Profile Update] ERROR: Missing name');
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        console.log('[Profile Update] Personal info:', {
            name: personal_info.name,
            email: personal_info.email,
            is_fresher: personal_info.is_fresher,
            experience_years: personal_info.experience_years
        });
        console.log('[Profile Update] Education count:', Array.isArray(education) ? education.length : 0);
        console.log('[Profile Update] Experience count:', Array.isArray(experience) ? experience.length : 0);

        // Handle Resume PDF (Base64 to Buffer)
        let resumePdfBuffer = null;
        if (personal_info.resume_pdf && typeof personal_info.resume_pdf === 'string') {
            try {
                // Check if it has a prefix like "data:application/pdf;base64," and strip it
                const matches = personal_info.resume_pdf.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                let mimeType = null;
                let base64Data = null;

                if (matches && matches.length === 3) {
                    mimeType = matches[1];
                    base64Data = matches[2];
                } else {
                    // Assume raw base64 string - we'll skip MIME validation
                    base64Data = personal_info.resume_pdf;
                }

                // Validate MIME type (if available)
                if (mimeType && mimeType !== 'application/pdf') {
                    console.log('[Profile Update] ERROR: Invalid MIME type:', mimeType);
                    client.release();
                    return res.status(400).json({
                        success: false,
                        message: 'Only PDF files are allowed'
                    });
                }

                // Convert to buffer
                resumePdfBuffer = Buffer.from(base64Data, 'base64');

                // Validate file size (10MB = 10 * 1024 * 1024 bytes)
                const maxSize = 10 * 1024 * 1024;
                if (resumePdfBuffer.length > maxSize) {
                    console.log('[Profile Update] ERROR: File too large:', resumePdfBuffer.length, 'bytes');
                    client.release();
                    return res.status(400).json({
                        success: false,
                        message: 'Resume file size must be less than 10MB'
                    });
                }

                console.log('[Profile Update] Resume PDF buffer size:', resumePdfBuffer.length, 'bytes');
            } catch (e) {
                console.error('[Profile Update] Error converting resume PDF to buffer:', e);
                client.release();
                return res.status(400).json({
                    success: false,
                    message: 'Invalid resume file format'
                });
            }
        }

        // Get user email from credentials
        console.log('[Profile Update] Fetching user email from credentials...');
        const credRes = await client.query('SELECT email FROM credentials WHERE id = $1', [userId]);
        const userEmail = credRes.rows[0]?.email;

        if (!userEmail) {
            console.log('[Profile Update] ERROR: User not found in credentials');
            client.release();
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log('[Profile Update] User email:', userEmail);

        // Extract single education and experience records (first item from arrays)
        const edu = Array.isArray(education) && education.length > 0 ? education[0] : null;
        const exp = Array.isArray(experience) && experience.length > 0 ? experience[0] : null;

        console.log('[Profile Update] Education data:', edu);
        console.log('[Profile Update] Experience data:', exp);

        // Fresher toggle logic
        let finalExperienceYears = personal_info.experience_years;
        if (personal_info.is_fresher) {
            finalExperienceYears = 0;
        }

        // Validation
        if (finalExperienceYears < 0) {
            console.log('[Profile Update] ERROR: Invalid experience years');
            client.release();
            return res.status(400).json({ success: false, message: 'Experience years must be >= 0' });
        }

        // Validate dates if both are provided
        if (exp && exp.start_date && exp.end_date && !exp.is_current) {
            const startDate = new Date(exp.start_date);
            const endDate = new Date(exp.end_date);
            if (endDate < startDate) {
                console.log('[Profile Update] ERROR: Invalid date range');
                client.release();
                return res.status(400).json({ success: false, message: 'End date must be after start date' });
            }
        }

        // Start Transaction
        console.log('[Profile Update] Starting transaction...');
        await client.query('BEGIN');

        // Build parameter array
        const params = [
            userId,                                          // $1
            personal_info.name,                             // $2
            userEmail,                                      // $3
            personal_info.phone_number || null,             // $4
            personal_info.location || null,                 // $5
            personal_info.github_url || null,               // $6
            personal_info.linkedin_url || null,             // $7
            personal_info.resume_url || null,               // $8
            personal_info.is_fresher || false,              // $9
            finalExperienceYears || 0,                      // $10
            personal_info.skills || [],                     // $11
            personal_info.profile_description || null,      // $12
            edu?.degree || null,                            // $13
            edu?.institution || null,                       // $14
            edu?.graduation_year || null,                   // $15
            edu?.gpa || null,                               // $16
            exp?.job_title || null,                         // $17
            exp?.company_name || null,                      // $18
            exp?.location || null,                          // $19
            exp?.start_date || null,                        // $20
            exp?.is_current ? null : (exp?.end_date || null), // $21
            exp?.is_current || false,                       // $22
            exp?.description || null                        // $23
        ];

        console.log('[Profile Update] Executing upsert with', params.length, 'parameters');

        // Upsert Candidate using user_id - Single Table UPDATE
        const candidateResult = await client.query(`
            INSERT INTO candidates (
                user_id,
                name, 
                email, 
                phone_number, 
                location, 
                github_url, 
                linkedin_url, 
                resume_url,
                is_fresher,
                experience_years,
                skills, 
                profile_description,
                -- Education fields
                degree,
                institution,
                graduation_year,
                gpa,
                -- Experience fields
                job_title,
                company_name,
                experience_location,
                exp_start_date,
                exp_end_date,
                is_current,
                experience_description,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET
                name = EXCLUDED.name,
                phone_number = EXCLUDED.phone_number,
                location = EXCLUDED.location,
                github_url = EXCLUDED.github_url,
                linkedin_url = EXCLUDED.linkedin_url,
                resume_url = EXCLUDED.resume_url,
                is_fresher = EXCLUDED.is_fresher,
                experience_years = EXCLUDED.experience_years,
                skills = EXCLUDED.skills,
                profile_description = EXCLUDED.profile_description,
                degree = EXCLUDED.degree,
                institution = EXCLUDED.institution,
                graduation_year = EXCLUDED.graduation_year,
                gpa = EXCLUDED.gpa,
                job_title = EXCLUDED.job_title,
                company_name = EXCLUDED.company_name,
                experience_location = EXCLUDED.experience_location,
                exp_start_date = EXCLUDED.exp_start_date,
                exp_end_date = EXCLUDED.exp_end_date,
                is_current = EXCLUDED.is_current,
                experience_description = EXCLUDED.experience_description,
                updated_at = NOW()
            RETURNING id;
        `, params);

        const candidateId = candidateResult.rows[0].id;
        console.log('[Profile Update] Candidate ID:', candidateId);

        // Commit Transaction
        await client.query('COMMIT');
        console.log('[Profile Update] Transaction committed successfully');
        console.log('[Profile Update] ========== END ===========');

        res.json({
            success: true,
            message: 'Profile saved successfully',
            data: {
                candidate_id: candidateId,
                experience_years: finalExperienceYears
            }
        });

    } catch (error) {
        // Rollback on any error
        try {
            await client.query('ROLLBACK');
            console.log('[Profile Update] Transaction rolled back');
        } catch (rollbackError) {
            console.error('[Profile Update] Rollback failed:', rollbackError);
        }

        console.error('[Profile Update] ========== ERROR ===========');
        console.error('[Profile Update] Error message:', error.message);
        console.error('[Profile Update] Error stack:', error.stack);
        console.error('[Profile Update] Error code:', error.code);
        console.error('[Profile Update] Error detail:', error.detail);
        console.error('[Profile Update] ============================');

        res.status(500).json({
            success: false,
            message: 'Failed to save profile',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/candidates/profile
// Get current user's profile (auto-create if doesn't exist)
router.get('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Try to fetch existing candidate profile using user_id
        let candidateRes = await pool.query(
            'SELECT * FROM candidates WHERE user_id = $1',
            [userId]
        );

        let candidate = candidateRes.rows[0];

        // If profile doesn't exist, auto-create it from credentials
        if (!candidate) {
            console.log(`[Profile GET] No profile found for user ${userId}, auto-creating...`);

            // Fetch user data from credentials
            const credentialsRes = await pool.query(
                'SELECT name, email FROM credentials WHERE id = $1',
                [userId]
            );

            if (credentialsRes.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User credentials not found'
                });
            }

            const { name, email } = credentialsRes.rows[0];

            // Create initial candidate profile
            const createRes = await pool.query(`
                INSERT INTO candidates (user_id, name, email, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING *
            `, [userId, name, email]);

            candidate = createRes.rows[0];
            console.log(`[Profile GET] Auto-created profile for ${email}`);
        }

        // Map education fields to array format (for frontend compatibility)
        const education = [];
        if (candidate.degree || candidate.institution) {
            education.push({
                id: candidate.id, // Use candidate ID as education ID
                degree: candidate.degree,
                institution: candidate.institution,
                graduation_year: candidate.graduation_year,
                gpa: candidate.gpa
            });
        }

        // Map experience fields to array format (for frontend compatibility)
        const experience = [];
        if (candidate.job_title || candidate.company_name) {
            experience.push({
                id: candidate.id, // Use candidate ID as experience ID
                job_title: candidate.job_title,
                company_name: candidate.company_name,
                location: candidate.experience_location,
                start_date: candidate.exp_start_date,
                end_date: candidate.exp_end_date,
                is_current: candidate.is_current,
                description: candidate.experience_description
            });
        }

        res.json({
            success: true,
            data: {
                ...candidate,
                experience: experience,
                education: education
            }
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/candidates/resume
// Fetch the authenticated user's PROFILE resume (from candidates.resume_url)
// This is ONLY for Profile page "View Resume" functionality
router.get('/resume', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(`[Profile Resume] User ${userId} requesting profile resume...`);

        // Fetch resume_pdf from candidates table (BYTEA, source of truth for Profile)
        const result = await pool.query(
            'SELECT resume_pdf, name FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.log(`[Profile Resume] No candidate profile found for user ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'Candidate profile not found'
            });
        }

        const { resume_pdf, name } = result.rows[0];

        if (!resume_pdf) {
            console.log(`[Profile Resume] No resume uploaded for user ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'No resume uploaded yet'
            });
        }

        console.log(`[Profile Resume] Resume found for ${name}, processing...`);

        let pdfBuffer;

        // Handle base64 string or Buffer (BYTEA)
        if (typeof resume_pdf === 'string') {
            try {
                // Check if it has a prefix like "data:application/pdf;base64," and strip it
                const matches = resume_pdf.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    pdfBuffer = Buffer.from(matches[2], 'base64');
                } else {
                    // Assume raw base64 string
                    pdfBuffer = Buffer.from(resume_pdf, 'base64');
                }
                console.log(`[Profile Resume] Converted base64 to buffer, size: ${pdfBuffer.length} bytes`);
            } catch (e) {
                console.error('[Profile Resume] Error converting base64 to buffer:', e);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process resume data'
                });
            }
        } else if (Buffer.isBuffer(resume_pdf)) {
            // Already a buffer (BYTEA case)
            pdfBuffer = resume_pdf;
            console.log(`[Profile Resume] Resume is already a buffer, size: ${pdfBuffer.length} bytes`);
        } else {
            console.error('[Profile Resume] Unexpected resume data type:', typeof resume_pdf);
            return res.status(500).json({
                success: false,
                message: 'Invalid resume data format'
            });
        }

        // Set headers and stream the PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${name}_resume.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        console.log(`[Profile Resume] Streaming PDF to client...`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('[Profile Resume] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume',
            error: error.message
        });
    }
});

// PATCH /api/candidates/fresher-status

// Update only the is_fresher status for current user
router.patch('/fresher-status', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { is_fresher } = req.body;

        // Validate role - only job seekers can update fresher status
        if (userRole !== 'job_seeker') {
            return res.status(403).json({
                success: false,
                message: 'Only job seekers can update fresher status'
            });
        }

        // Validate is_fresher value
        if (typeof is_fresher !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_fresher must be a boolean value'
            });
        }

        // Check if candidate profile exists
        const checkQuery = 'SELECT id FROM candidates WHERE user_id = $1';
        const checkResult = await pool.query(checkQuery, [userId]);

        let candidateId;

        if (checkResult.rows.length === 0) {
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

            const createQuery = `
                INSERT INTO candidates (user_id, name, email, is_fresher, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING id
            `;
            const createResult = await pool.query(createQuery, [userId, name, email, is_fresher]);
            candidateId = createResult.rows[0].id;

            console.log(`[Fresher Status] Auto-created profile for user ${userId} with is_fresher=${is_fresher}`);
        } else {
            // Update existing candidate
            candidateId = checkResult.rows[0].id;

            const updateQuery = `
                UPDATE candidates 
                SET is_fresher = $1, updated_at = NOW()
                WHERE user_id = $2
            `;
            await pool.query(updateQuery, [is_fresher, userId]);

            console.log(`[Fresher Status] Updated user ${userId} to is_fresher=${is_fresher}`);
        }

        res.json({
            success: true,
            message: 'Fresher status updated successfully',
            data: {
                candidate_id: candidateId,
                is_fresher: is_fresher
            }
        });

    } catch (error) {
        console.error('Error updating fresher status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating fresher status'
        });
    }
});

// GET /api/candidates - List all (Keep existing for debugging/admin)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY updated_at DESC');
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Note: POST /education and POST /experience endpoints removed.
// Use POST /profile to save all profile data including education and experience.

// GET /api/candidates/:email - Get full profile
router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const candidateRes = await pool.query('SELECT * FROM candidates WHERE email = $1', [email]);

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        const candidate = candidateRes.rows[0];

        // Map education fields to array format
        const education = [];
        if (candidate.degree || candidate.institution) {
            education.push({
                id: candidate.id,
                degree: candidate.degree,
                institution: candidate.institution,
                graduation_year: candidate.graduation_year,
                gpa: candidate.gpa
            });
        }

        // Map experience fields to array format
        const experience = [];
        if (candidate.job_title || candidate.company_name) {
            experience.push({
                id: candidate.id,
                job_title: candidate.job_title,
                company_name: candidate.company_name,
                location: candidate.experience_location,
                start_date: candidate.exp_start_date,
                end_date: candidate.exp_end_date,
                is_current: candidate.is_current,
                description: candidate.experience_description
            });
        }

        res.json({
            success: true,
            data: {
                personal_info: candidate,
                experience: experience,
                education: education
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


export default router;
