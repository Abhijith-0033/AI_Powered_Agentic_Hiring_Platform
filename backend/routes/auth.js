import express from 'express';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
import {
    isValidEmail,
    validateRequired,
    isValidPassword,
    isValidIntent,
    mapIntentToRole
} from '../utils/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 * @body    { name, email, password, intent }
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, intent } = req.body;

        // Validate required fields
        const requiredCheck = validateRequired(
            { name, email, password, intent },
            ['name', 'email', 'password', 'intent']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({
                success: false,
                message: requiredCheck.message
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate password strength
        const passwordCheck = isValidPassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({
                success: false,
                message: passwordCheck.message
            });
        }

        // Validate intent
        if (!isValidIntent(intent)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid intent. Must be "job" or "employee"'
            });
        }

        // Map intent to role
        const role = mapIntentToRole(intent);
        const normalizedEmail = email.toLowerCase();

        // Import PostgreSQL pool and bcrypt
        const { query } = await import('../config/db.js');
        const bcrypt = await import('bcryptjs');

        // Check if user already exists
        const checkUserQuery = `
            SELECT id FROM credentials WHERE email = $1
        `;
        const { rows: existingRows } = await query(checkUserQuery, [normalizedEmail]);

        if (existingRows.length > 0) {
            throw new Error('Email already exists');
        }

        // Hash password with bcrypt (salt rounds: 10)
        const passwordHash = await bcrypt.default.hash(password, 10);

        // Insert new user (parameterized query prevents SQL injection)
        const insertQuery = `
            INSERT INTO credentials (email, password_hash, role, is_verified, name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, role, is_verified, name, created_at
        `;

        const { rows: insertedRows } = await query(insertQuery, [
            normalizedEmail,
            passwordHash,
            role,
            false,
            name
        ]);

        const user = insertedRows[0];

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (error.message === 'Email already exists') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please use a different email or log in.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login existing user - Validates credentials and returns user with role
 * @access  Public
 * @body    { email, password }
 * 
 * SECURITY IMPLEMENTATION:
 * - Direct PostgreSQL access (no Supabase REST API)
 * - Parameterized queries prevent SQL injection
 * - bcrypt password hashing
 * - Password hash never exposed in response
 * - Returns user role for frontend routing
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        const requiredCheck = validateRequired(
            { email, password },
            ['email', 'password']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({
                success: false,
                message: requiredCheck.message
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Import PostgreSQL pool and bcrypt
        const { query } = await import('../config/db.js');
        const bcrypt = await import('bcryptjs');

        // Check if user exists (parameterized query)
        const checkUserQuery = `
            SELECT id, email, password_hash, role, is_verified, name, created_at
            FROM credentials
            WHERE email = $1
        `;

        const { rows } = await query(checkUserQuery, [normalizedEmail]);
        const existingUser = rows[0];

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.default.compare(password, existingUser.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email,
                role: existingUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Remove password_hash from response (SECURITY: Never expose password hash)
        const { password_hash, ...sanitizedUser } = existingUser;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: sanitizedUser
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info from PostgreSQL
 * @access  Private (requires JWT)
 */
router.get('/me', auth, async (req, res) => {
    try {
        // Import PostgreSQL pool
        const { query } = await import('../config/db.js');

        // Query user from credentials table using ID from JWT
        const getUserQuery = `
            SELECT id, email, role, is_verified, name, created_at
            FROM credentials
            WHERE id = $1
        `;

        const { rows } = await query(getUserQuery, [req.user.userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
