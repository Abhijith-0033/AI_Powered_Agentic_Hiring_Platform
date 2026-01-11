import { Navigate, Route, Routes } from 'react-router-dom';

// Pages
import Landing from '../pages/Landing';
import {
    AITools,
    ApplicantManagement,
    CompanyProfile,
    JobPosting,
    ProviderDashboard,
} from '../pages/provider';
import {
    AIActions,
    ApplicationTracker,
    JobDiscovery,
    Profile,
    ResumeTools,
    UserDashboard,
} from '../pages/user';

// Auth components
import AuthPage from '../components/auth/AuthPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';

/**
 * Application routes configuration
 * Handles routing for Landing, Auth, User (protected), and Provider (protected) dashboards
 */
const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthPage />} />

            {/* User (Job Seeker) Routes - Protected */}
            <Route element={<ProtectedRoute allowedRoles={['job_seeker']} />}>
                <Route path="/user">
                    <Route index element={<Navigate to="/user/dashboard" replace />} />
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="resume-tools" element={<ResumeTools />} />
                    <Route path="jobs" element={<JobDiscovery />} />
                    <Route path="ai-actions" element={<AIActions />} />
                    <Route path="applications" element={<ApplicationTracker />} />
                </Route>
            </Route>

            {/* Provider (Recruiter) Routes - Protected */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
                <Route path="/provider">
                    <Route index element={<Navigate to="/provider/dashboard" replace />} />
                    <Route path="dashboard" element={<ProviderDashboard />} />
                    <Route path="post-job" element={<JobPosting />} />
                    <Route path="applicants" element={<ApplicantManagement />} />
                    <Route path="ai-tools" element={<AITools />} />
                    <Route path="company" element={<CompanyProfile />} />
                </Route>
            </Route>

            {/* Catch-all redirect to login for unauthenticated users */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
