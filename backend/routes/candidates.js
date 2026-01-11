import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/candidates/profile
// Transactional Upsert of Candidate Profile + Experience + Education
router.post('/profile', async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            personal_info,
            experience,
            education
        } = req.body;

        // Basic Validation
        if (!personal_info || !personal_info.email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        if (!personal_info.name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        console.log(`[Profile Update] Starting transaction for ${personal_info.email}`);

        // Handle Resume PDF (Base64 to Buffer)
        let resumePdfBuffer = null;
        if (personal_info.resume_pdf && typeof personal_info.resume_pdf === 'string') {
            try {
                // Check if it has a prefix like "data:application/pdf;base64," and strip it
                const matches = personal_info.resume_pdf.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    resumePdfBuffer = Buffer.from(matches[2], 'base64');
                } else {
                    // Assume raw base64 string
                    resumePdfBuffer = Buffer.from(personal_info.resume_pdf, 'base64');
                }
            } catch (e) {
                console.error('Error converting resume PDF to buffer:', e);
                // Proceed without PDF if conversion fails (or maybe throw error depending on strictness)
            }
        }

        // 1. Start Transaction
        await client.query('BEGIN');

        // 2. Upsert Candidate
        // Using ON CONFLICT logic for PostgreSQL - STRICT AUTHORITATIVE QUERY
        const candidateResult = await client.query(`
            INSERT INTO candidates (
                name, 
                email, 
                phone_number, 
                location, 
                github_url, 
                linkedin_url, 
                resume_pdf,
                resume_url,
                is_fresher,
                experience_years,
                skills, 
                profile_description, 
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            ON CONFLICT (email) 
            DO UPDATE SET
                name = EXCLUDED.name,
                phone_number = EXCLUDED.phone_number,
                location = EXCLUDED.location,
                github_url = EXCLUDED.github_url,
                linkedin_url = EXCLUDED.linkedin_url,
                resume_pdf = EXCLUDED.resume_pdf,
                resume_url = EXCLUDED.resume_url,
                is_fresher = EXCLUDED.is_fresher,
                experience_years = EXCLUDED.experience_years,
                skills = EXCLUDED.skills,
                profile_description = EXCLUDED.profile_description,
                updated_at = NOW()
            RETURNING id;
        `, [
            personal_info.name,
            personal_info.email,
            personal_info.phone_number,
            personal_info.location,
            personal_info.github_url,
            personal_info.linkedin_url,
            resumePdfBuffer, // $7: resume_pdf (BYTEA)
            personal_info.resume_url, // $8: resume_url (TEXT)
            personal_info.is_fresher, // $9: is_fresher (BOOLEAN)
            personal_info.experience_years, // $10: experience_years (INTEGER)
            personal_info.skills || [],
            personal_info.profile_description
        ]);

        const candidateId = candidateResult.rows[0].id;

        // 3. Handle Experience
        // First, delete existing
        await client.query('DELETE FROM candidate_experience WHERE candidate_id = $1', [candidateId]);

        if (Array.isArray(experience) && experience.length > 0) {
            for (const exp of experience) {
                await client.query(`
                    INSERT INTO candidate_experience (
                        candidate_id, job_title, company_name, location, 
                        start_date, end_date, is_current, description
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    candidateId,
                    exp.job_title,
                    exp.company_name,
                    exp.location,
                    exp.start_date,
                    exp.is_current ? null : exp.end_date,
                    exp.is_current,
                    exp.description
                ]);
            }
        }
        // Removed dynamic calculation of experience_years as it must come from the form


        // 5. Handle Education
        // First, delete existing
        await client.query('DELETE FROM candidate_education WHERE candidate_id = $1', [candidateId]);

        if (Array.isArray(education) && education.length > 0) {
            for (const edu of education) {
                await client.query(`
                    INSERT INTO candidate_education (
                        candidate_id, degree, institution, graduation_year, gpa
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    candidateId,
                    edu.degree,
                    edu.institution,
                    edu.graduation_year,
                    edu.gpa
                ]);
            }
        }

        // 6. Commit Transaction
        await client.query('COMMIT');
        console.log(`[Profile Update] Transaction committed for ${candidateId}`);

        res.json({
            success: true,
            message: 'Profile saved successfully',
            data: {
                candidate_id: candidateId,
                experience_years: personal_info.experience_years
            }
        });

    } catch (error) {
        // Rollback on any error
        await client.query('ROLLBACK');
        console.error('[Profile Update] Transaction failed:', error);
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
// Get current user's profile
router.get('/profile', auth, async (req, res) => {
    try {
        const { email } = req.user;

        const candidateRes = await pool.query('SELECT * FROM candidates WHERE email = $1', [email]);

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        const candidate = candidateRes.rows[0];

        // Fetch Experience and Education
        const experienceRes = await pool.query(
            'SELECT * FROM candidate_experience WHERE candidate_id = $1 ORDER BY start_date DESC',
            [candidate.id]
        );
        const educationRes = await pool.query(
            'SELECT * FROM candidate_education WHERE candidate_id = $1 ORDER BY graduation_year DESC',
            [candidate.id]
        );

        // Resume PDF to Base64 for frontend if needed (or just send URL)
        // Sending heavy buffer might be slow, usually we send URL. 
        // For now, let's keep it simple and just send what we have, 
        // but maybe exclude resume_pdf buffer from JSON to save bandwidth unless requested?
        // The frontend expects `resume_pdf`? 
        // Let's send it to be safe as per "restore state".

        // Convert buffer to base64 string if it exists?
        // The frontend `Profile.jsx` doesn't seem to pre-fill the file input from base64 string, 
        // but it might use `resumeUrl`.
        // Let's just return the data.

        res.json({
            success: true,
            data: {
                ...candidate,
                experience: experienceRes.rows,
                education: educationRes.rows
            }
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

// POST /api/candidates/education
// Add a single education record
router.post('/education', auth, async (req, res) => {
    try {
        const { degree, institution, graduation_year, gpa } = req.body;
        const { email } = req.user;

        // Validation using DB constraints mainly, but basic check here
        if (!degree || !institution) {
            return res.status(400).json({ success: false, message: 'Degree and Institution are required' });
        }

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [email]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Insert
        const query = `
            INSERT INTO candidate_education (
                candidate_id, degree, institution, graduation_year, gpa
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [candidateId, degree, institution, graduation_year || null, gpa || null];

        const result = await pool.query(query, values);

        res.status(201).json({ success: true, data: result.rows[0], message: 'Education added successfully' });

    } catch (error) {
        console.error('Error adding education:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/candidates/experience
// Add a single experience record
router.post('/experience', auth, async (req, res) => {
    try {
        const { title, company, location, start_date, end_date, current, description } = req.body;
        const { email } = req.user;

        if (!title || !company || !start_date) {
            return res.status(400).json({ success: false, message: 'Title, Company and Start Date are required' });
        }

        const candidateRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [email]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        const query = `
            INSERT INTO candidate_experience (
                candidate_id, job_title, company_name, location, start_date, end_date, is_current, description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            candidateId,
            title,
            company,
            location,
            start_date,
            (current ? null : (end_date || null)),
            current || false,
            description
        ];

        const result = await pool.query(query, values);

        res.status(201).json({ success: true, data: result.rows[0], message: 'Experience added successfully' });

    } catch (error) {
        console.error('Error adding experience:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/candidates/:email - Get full profile
router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const candidateRes = await pool.query('SELECT * FROM candidates WHERE email = $1', [email]);

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        const candidate = candidateRes.rows[0];
        const experienceRes = await pool.query('SELECT * FROM candidate_experience WHERE candidate_id = $1 ORDER BY start_date DESC', [candidate.id]);
        const educationRes = await pool.query('SELECT * FROM candidate_education WHERE candidate_id = $1 ORDER BY graduation_year DESC', [candidate.id]);

        res.json({
            success: true,
            data: {
                personal_info: candidate,
                experience: experienceRes.rows,
                education: educationRes.rows
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


export default router;
