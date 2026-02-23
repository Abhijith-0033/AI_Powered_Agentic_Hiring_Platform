/**
 * Middleware to restrict access to Admin users only
 * Expects req.user to be populated by auth middleware
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Admin access required.',
            userRole: req.user.role
        });
    }

    next();
};

export default requireAdmin;
