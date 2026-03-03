import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (Job Seekers and Recruiters)
 * @access  Private (Admin only)
 */
router.get('/users', auth, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                cr.id, cr.email, cr.role, cr.name, cr.is_verified, cr.created_at,
                ca.id as candidate_id, ca.is_deleted as candidate_deleted,
                co.id as company_id, co.is_deleted as company_deleted
            FROM credentials cr
            LEFT JOIN candidates ca ON cr.id = ca.user_id
            LEFT JOIN companies co ON cr.id = co.created_by
            ORDER BY cr.created_at DESC
        `;
        const { rows } = await pool.query(query);

        // Sanitize response: a user is "soft deleted" if their associated profile has is_deleted=true
        const users = rows.map(u => ({
            ...u,
            is_deleted: u.role === 'job_seeker' ? !!u.candidate_deleted : (u.role === 'recruiter' ? !!u.company_deleted : false)
        }));

        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('Admin Fetch Users Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Soft delete a user by setting is_deleted flag in their profile
 * @access  Private (Admin only)
 */
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const adminId = req.user.userId;

        if (targetUserId === adminId) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }

        // Check user exists and get role
        const userCheck = await pool.query('SELECT role FROM credentials WHERE id = $1', [targetUserId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const role = userCheck.rows[0].role;
        let updateQuery = '';

        if (role === 'job_seeker') {
            updateQuery = 'UPDATE candidates SET is_deleted = true WHERE user_id = $1';
        } else if (role === 'recruiter') {
            updateQuery = 'UPDATE companies SET is_deleted = true WHERE created_by = $1';
        } else {
            return res.status(400).json({ success: false, message: 'Cannot soft delete an admin user via this endpoint' });
        }

        await pool.query(updateQuery, [targetUserId]);

        console.log(`[Admin] User ${targetUserId} soft-deleted by Admin ${adminId}`);
        res.json({ success: true, message: 'User soft-deleted successfully' });
    } catch (error) {
        console.error('Admin Soft Delete Error:', error);
        res.status(500).json({ success: false, message: 'Server error during soft delete' });
    }
});

/**
 * @route   GET /api/admin/jobs
 * @desc    Get all jobs in the system
 * @access  Private (Admin only)
 */
router.get('/jobs', auth, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT jp.*, c.name as company_name 
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id = c.id
            ORDER BY jp.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Admin Fetch Jobs Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching jobs' });
    }
});

/**
 * @route   GET /api/admin/applications
 * @desc    Get all applications in the system
 * @access  Private (Admin only)
 */
router.get('/applications', auth, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT ja.*, jp.job_title, c.name as candidate_name, comp.name as company_name
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN candidates c ON ja.candidate_id = c.id
            JOIN companies comp ON ja.company_id = comp.id
            ORDER BY ja.applied_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Admin Fetch Applications Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching applications' });
    }
});

/**
 * @route   POST /api/admin/impersonate/:userId
 * @desc    Generate a temporary JWT for the selected user
 * @access  Private (Admin only)
 */
router.post('/impersonate/:userId', auth, requireAdmin, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const adminId = req.user.userId;

        // Fetch user details
        const query = 'SELECT id, email, role FROM credentials WHERE id = $1';
        const { rows } = await pool.query(query, [targetUserId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = rows[0];

        // Generate impersonation token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                impersonated: true,
                adminId: adminId
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log(`[Admin] Admin ${adminId} impersonating user ${targetUserId}`);

        res.json({
            success: true,
            message: 'Impersonation token generated',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin Impersonate Error:', error);
        res.status(500).json({ success: false, message: 'Server error during impersonation' });
    }
});

export default router;
