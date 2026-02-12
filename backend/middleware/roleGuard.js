/**
 * Role-Based Authorization Middleware Factory
 * Checks if authenticated user has required role
 * @param {Array<string>} allowedRoles - Array of allowed roles (e.g., ['job_seeker', 'recruiter'])
 * @returns {Function} Express middleware function
 */
const roleGuard = (allowedRoles) => {
    // Ensure allowedRoles is an array
    if (typeof allowedRoles === 'string') {
        allowedRoles = [allowedRoles];
    }

    return (req, res, next) => {
        // Ensure user is authenticated (auth middleware should run first)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
                userRole: req.user.role
            });
        }

        next();
    };
};

export default roleGuard;
