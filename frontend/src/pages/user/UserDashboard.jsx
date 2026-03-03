import {
    Briefcase,
    Calendar,
    Eye,
    Send,
    Target
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { JobCard, MetricCard } from '../../components/shared';
import JobApplyModal from '../../components/shared/JobApplyModal';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getDashboardStats } from '../../api/users';
import { getJobs } from '../../api/jobs';

/**
 * User Dashboard page
 * Shows overview metrics, activity timeline, and recommended jobs
 */
const UserDashboard = () => {
    const [stats, setStats] = useState({
        applicationsSent: 0,
        matchesFound: 0,
        profileViews: 0,
        interviewsScheduled: 0,
        profileCompletion: 0
    });

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [selectedJob, setSelectedJob] = useState(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, jobsData] = await Promise.all([
                    getDashboardStats(),
                    getJobs({ status: 'Open' }) // Fetch some jobs for recommendation
                ]);

                if (statsData.success) {
                    setStats(statsData.data);
                }

                if (jobsData.success && Array.isArray(jobsData.data)) {
                    setJobs(jobsData.data);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);



    if (loading) {
        return (
            <DashboardLayout type="user" title="Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-neutral-500">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="user" title="Dashboard">
            {/* Welcome Message */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Welcome back! 👋
                </h2>
                <p className="text-neutral-500">
                    Here's what's happening with your job search today.
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Applications Sent"
                    value={stats.applicationsSent}
                    change="0"
                    trend="neutral"
                    icon={Send}
                    color="primary"
                />
                <MetricCard
                    title="Matches Found"
                    value={stats.matchesFound}
                    change="0"
                    trend="neutral"
                    icon={Target}
                    color="success"
                />
                <MetricCard
                    title="Profile Views"
                    value={stats.profileViews}
                    change="0"
                    trend="neutral"
                    icon={Eye}
                    color="secondary"
                />
                <MetricCard
                    title="Interviews"
                    value={stats.interviewsScheduled}
                    change="0"
                    trend="neutral"
                    icon={Calendar}
                    color="warning"
                />
            </div>

            {/* Profile Completion */}
            <Card className="mb-8">
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900">Profile Completion</h3>
                            <p className="text-sm text-neutral-500">Complete your profile to get better matches</p>
                        </div>
                        <span className="text-2xl font-bold text-primary-600">
                            {stats.profileCompletion}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                            style={{ width: `${stats.profileCompletion}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-8">
                {/* Recommended Jobs */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-neutral-900">Recommended Jobs</h3>
                        <Badge variant="primary" dot>
                            {jobs.length} Available
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {jobs.slice(0, 6).map((job, index) => (
                            <div
                                key={job.job_id}
                                className="animate-slide-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <JobCard
                                    job={job}
                                    onApply={() => {
                                        setSelectedJob(job);
                                        setIsApplyModalOpen(true);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <JobApplyModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                job={selectedJob}
            />
        </DashboardLayout>
    );
};

export default UserDashboard;
