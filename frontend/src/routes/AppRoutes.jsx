import { Navigate, Route, Routes } from 'react-router-dom';

// Pages
import Landing from '../pages/Landing';
import {
    AITools,
    AutoShortlist,
    InterviewScheduler,
    ApplicantManagement,
    CompanyProfile,
    JobPosting,
    ProviderDashboard,
} from '../pages/provider';
import {
    AIActions,
    ApplicationTracker,
    JobDiscovery,
    JobsInIndia,
    Profile,
    UserDashboard,
} from '../pages/user';

// Auth components
import AuthPage from '../components/auth/AuthPage';
import OAuthSuccess from '../components/auth/OAuthSuccess';
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
            <Route path="/oauth-success" element={<OAuthSuccess />} />

            {/* User (Job Seeker) Routes - Protected */}
            <Route element={<ProtectedRoute allowedRoles={['job_seeker']} />}>
                <Route path="/user">
                    <Route index element={<Navigate to="/user/dashboard" replace />} />
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="jobs" element={<JobDiscovery />} />
                    <Route path="jobs-india" element={<JobsInIndia />} />
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
                    <Route path="ai-tools/auto-shortlist" element={<AutoShortlist />} />
                    <Route path="ai-tools/interview-scheduler" element={<InterviewScheduler />} />
                    <Route path="company" element={<CompanyProfile />} />
                </Route>
            </Route>

            {/* Catch-all redirect to login for unauthenticated users */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
