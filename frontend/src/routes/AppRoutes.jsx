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
    InterviewsPage as ProviderInterviewsPage,
    TestsPage as ProviderTestsPage,
} from '../pages/provider';
import {
    AIActions,
    ApplicationTracker,
    JobDiscovery,
    JobsInIndia,
    Profile,
    UserDashboard,
    InterviewsPage as UserInterviewsPage,
    MyTestsPage,
    TestResultPage,
} from '../pages/user';
import TestAttemptPage from '../pages/user/TestAttemptPage';

// Auth components
import AuthPage from '../components/auth/AuthPage';
import OAuthSuccess from '../components/auth/OAuthSuccess';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Shared components
import InterviewRoom from '../pages/InterviewRoom';

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
                    <Route path="interviews" element={<UserInterviewsPage />} />
                    <Route path="tests" element={<MyTestsPage />} />
                    <Route path="tests/:id/attempt" element={<TestAttemptPage />} />
                    <Route path="tests/:id/results" element={<TestResultPage />} />
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
                    <Route path="interviews" element={<ProviderInterviewsPage />} />
                    <Route path="tests" element={<ProviderTestsPage />} />
                </Route>
            </Route>

            {/* Shared Interview Room Route (accessible by both roles) */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter', 'job_seeker']} />}>
                <Route path="/interview/:channelName" element={<InterviewRoom />} />
            </Route>

            {/* Catch-all redirect to login for unauthenticated users */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
