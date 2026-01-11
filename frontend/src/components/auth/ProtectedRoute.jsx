import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Protected Route Component
 * Ensures user is authenticated and has required role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-dark-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check role authorization
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User doesn't have required role - redirect to their correct dashboard
        const redirectPath = user.role === 'job_seeker' ? '/user/dashboard' : '/provider/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // User is authenticated and authorized - render children
    return <Outlet />;
};

export default ProtectedRoute;
