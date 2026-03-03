import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './../../components/ui/LoadingSpinner';

/**
 * Protected Route Component
 * Ensures user is authenticated and has required role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="xl" color="text-primary-500" className="mb-4" />
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
        let redirectPath = '/user/dashboard';
        if (user.role === 'recruiter') redirectPath = '/provider/dashboard';
        if (user.role === 'admin') redirectPath = '/admin/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // User is authenticated and authorized - render children
    return <Outlet />;
};

export default ProtectedRoute;
