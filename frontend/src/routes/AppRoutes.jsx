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

/**
 * Application routes configuration
 * Handles routing for Landing, User, and Provider dashboards
 */
const AppRoutes = () => {
    return (
        <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Landing />} />

            {/* User (Job Seeker) Routes */}
            <Route path="/user">
                <Route index element={<Navigate to="/user/dashboard" replace />} />
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="resume-tools" element={<ResumeTools />} />
                <Route path="jobs" element={<JobDiscovery />} />
                <Route path="ai-actions" element={<AIActions />} />
                <Route path="applications" element={<ApplicationTracker />} />
            </Route>

            {/* Provider (Recruiter) Routes */}
            <Route path="/provider">
                <Route index element={<Navigate to="/provider/dashboard" replace />} />
                <Route path="dashboard" element={<ProviderDashboard />} />
                <Route path="post-job" element={<JobPosting />} />
                <Route path="applicants" element={<ApplicantManagement />} />
                <Route path="ai-tools" element={<AITools />} />
                <Route path="company" element={<CompanyProfile />} />
            </Route>

            {/* Catch-all redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
