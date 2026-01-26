import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import pool from '../config/db.js';

const router = express.Router();

// Multer setup for handling file uploads (stored in memory as buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

/**
 * @route   GET /api/companies/mine
 * @desc    Get the current recruiter's company profile
 * @access  Private (Recruiter only)
 */
router.get('/mine', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        // Query company by created_by
        const query = `
            SELECT * FROM companies 
            WHERE created_by = $1
        `;
        const { rows } = await pool.query(query, [userId]);

        if (rows.length === 0) {
            return res.json({
                success: true,
                company: null
            });
        }

        const company = rows[0];

        // Convert binary logo to base64 if it exists
        if (company.logo) {
            company.logo = `data:image/jpeg;base64,${company.logo.toString('base64')}`;
        }

        res.json({
            success: true,
            company
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company profile'
        });
    }
});

/**
 * @route   POST /api/companies
 * @desc    Create or Update company profile
 * @access  Private (Recruiter only)
 */
router.post('/', auth, roleGuard('recruiter'), upload.single('logo'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, industry, website_url, location, description, linkedin_url, twitter_url } = req.body;
        const logoFile = req.file;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        // Check if company exists for this user
        const checkQuery = 'SELECT id FROM companies WHERE created_by = $1';
        const { rows: existingRows } = await pool.query(checkQuery, [userId]);
        const existingCompany = existingRows[0];

        let result;

        if (existingCompany) {
            // UDPATE existing company
            let updateQuery = `
                UPDATE companies 
                SET name = $1, 
                    industry = $2, 
                    website_url = $3, 
                    location = $4, 
                    description = $5, 
                    linkedin_url = $6, 
                    twitter_url = $7,
                    updated_at = NOW()
            `;

            const params = [name, industry, website_url, location, description, linkedin_url, twitter_url];
            let paramCount = 7;

            // Only update logo if a new one is uploaded
            if (logoFile) {
                paramCount++;
                updateQuery += `, logo = $${paramCount}`;
                params.push(logoFile.buffer);
            }

            updateQuery += ` WHERE id = $${paramCount + 1} RETURNING *`;
            params.push(existingCompany.id);

            const { rows } = await pool.query(updateQuery, params);
            result = rows[0];

        } else {
            // INSERT new company
            const insertQuery = `
                INSERT INTO companies (
                    name, industry, website_url, location, description, 
                    linkedin_url, twitter_url, created_by, logo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `; // Note: is_verified default false

            const params = [
                name, industry, website_url, location, description,
                linkedin_url, twitter_url, userId, logoFile ? logoFile.buffer : null
            ];

            const { rows } = await pool.query(insertQuery, params);
            result = rows[0];
        }

        // Convert logo to base64 for response
        if (result.logo) {
            result.logo = `data:image/jpeg;base64,${result.logo.toString('base64')}`;
        }

        res.json({
            success: true,
            message: 'Company profile saved successfully',
            company: result
        });

    } catch (error) {
        console.error('Error saving company:', error);

        // Handle unique constraint violation (name, created_by)
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'A company with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error saving company profile'
        });
    }
});

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company profile (Access by ID) - Redirects logic to POST logic effectively mostly, but dedicated endpoint as requested
 * @access  Private (Recruiter only)
 */
router.put('/:id', auth, roleGuard('recruiter'), upload.single('logo'), async (req, res) => {
    // Check ownership
    const userId = req.user.userId;
    const companyId = req.params.id;

    // Ensure the company belongs to the user
    const checkQuery = 'SELECT id FROM companies WHERE id = $1 AND created_by = $2';
    const { rows } = await pool.query(checkQuery, [companyId, userId]);

    if (rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Company not found or unauthorized'
        });
    }

    // Use the same logic as POST (Update) part basically
    // Or just modify the logic above to reuse function. 
    // For simplicity and strict adherence to "Create endpoints: POST /companies, PUT /companies/:id", I implemented logic in POST for "My Company" flow (Profile style).
    // But strictly strictly speaking, PUT /companies/:id should update a specific company. 
    // I'll implement it here similar to update block above.

    try {
        const { name, industry, website_url, location, description, linkedin_url, twitter_url } = req.body;
        const logoFile = req.file;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        let updateQuery = `
            UPDATE companies 
            SET name = $1, 
                industry = $2, 
                website_url = $3, 
                location = $4, 
                description = $5, 
                linkedin_url = $6, 
                twitter_url = $7,
                updated_at = NOW()
        `;

        const params = [name, industry, website_url, location, description, linkedin_url, twitter_url];
        let paramCount = 7;

        if (logoFile) {
            paramCount++;
            updateQuery += `, logo = $${paramCount}`;
            params.push(logoFile.buffer);
        }

        updateQuery += ` WHERE id = $${paramCount + 1} RETURNING *`;
        params.push(companyId);

        const { rows: updatedRows } = await pool.query(updateQuery, params);
        const result = updatedRows[0];

        if (result.logo) {
            result.logo = `data:image/jpeg;base64,${result.logo.toString('base64')}`;
        }

        res.json({
            success: true,
            message: 'Company profile updated successfully',
            company: result
        });

    } catch (error) {
        console.error('Error updating company:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Company name conflict'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error updating company'
        });
    }
});

export default router;
