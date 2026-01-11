import {
    Briefcase,
    Calendar,
    Clock,
    Eye,
    Send,
    Target
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { JobCard, MetricCard } from '../../components/shared';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getDashboardStats, getUserActivity } from '../../api/users';
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
    const [activity, setActivity] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, activityData, jobsData] = await Promise.all([
                    getDashboardStats(),
                    getUserActivity(),
                    getJobs({ status: 'Open' }) // Fetch some jobs for recommendation
                ]);

                if (statsData.success) {
                    setStats(statsData.data);
                }
                if (activityData.success && Array.isArray(activityData.data)) {
                    setActivity(activityData.data);
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

    const getActivityIcon = (type) => {
        switch (type) {
            case 'application': return Send;
            case 'match': return Target;
            case 'interview': return Calendar;
            case 'view': return Eye;
            default: return Briefcase;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'application': return 'primary';
            case 'match': return 'success';
            case 'interview': return 'warning';
            case 'view': return 'info';
            default: return 'default';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <DashboardLayout type="user" title="Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-dark-400">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="user" title="Dashboard">
            {/* Welcome Message */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark-100 mb-2">
                    Welcome back! 👋
                </h2>
                <p className="text-dark-400">
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
                            <h3 className="text-lg font-semibold text-dark-100">Profile Completion</h3>
                            <p className="text-sm text-dark-400">Complete your profile to get better matches</p>
                        </div>
                        <span className="text-2xl font-bold text-primary-400">
                            {stats.profileCompletion}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                            style={{ width: `${stats.profileCompletion}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Activity Timeline */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activity.length > 0 ? (
                            <div className="space-y-4">
                                {activity.map((item, index) => {
                                    const Icon = getActivityIcon(item.type);
                                    const color = getActivityColor(item.type);

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex gap-3 animate-slide-in-right"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className={`
                                                p-2 rounded-lg flex-shrink-0
                                                ${color === 'primary' ? 'bg-primary-500/20 text-primary-400' :
                                                    color === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        color === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-sky-500/20 text-sky-400'}
                                                `}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-dark-200 truncate">{item.title}</p>
                                                <p className="text-xs text-dark-500">{item.company}</p>
                                                <p className="text-xs text-dark-600 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(item.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-dark-400 text-sm">
                                No recent activity
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recommended Jobs */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-dark-100">Recommended Jobs</h3>
                        <Badge variant="primary" dot>
                            {jobs.length} Available
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        {jobs.slice(0, 3).map((job, index) => (
                            <div
                                key={job.job_id}
                                className="animate-slide-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <JobCard job={job} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserDashboard;
