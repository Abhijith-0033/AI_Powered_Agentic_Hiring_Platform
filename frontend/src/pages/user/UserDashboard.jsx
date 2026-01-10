import {
    Briefcase,
    Calendar,
    Clock,
    Eye,
    Send,
    Target
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { JobCard, MetricCard } from '../../components/shared';
import Badge from '../../components/ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { jobs } from '../../mockData/jobs';
import { dashboardStats, userActivity } from '../../mockData/users';

/**
 * User Dashboard page
 * Shows overview metrics, activity timeline, and recommended jobs
 */
const UserDashboard = () => {
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

    return (
        <DashboardLayout type="user" title="Dashboard">
            {/* Welcome Message */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark-100 mb-2">
                    Welcome back, Alex! 👋
                </h2>
                <p className="text-dark-400">
                    Here's what's happening with your job search today.
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Applications Sent"
                    value={dashboardStats.applicationsSent}
                    change="+3"
                    trend="up"
                    icon={Send}
                    color="primary"
                />
                <MetricCard
                    title="Matches Found"
                    value={dashboardStats.matchesFound}
                    change="+12"
                    trend="up"
                    icon={Target}
                    color="success"
                />
                <MetricCard
                    title="Profile Views"
                    value={dashboardStats.profileViews}
                    change="+24"
                    trend="up"
                    icon={Eye}
                    color="secondary"
                />
                <MetricCard
                    title="Interviews"
                    value={dashboardStats.interviewsScheduled}
                    change="+1"
                    trend="up"
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
                            {dashboardStats.profileCompletion}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                            style={{ width: `${dashboardStats.profileCompletion}%` }}
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
                        <div className="space-y-4">
                            {userActivity.slice(0, 5).map((activity, index) => {
                                const Icon = getActivityIcon(activity.type);
                                const color = getActivityColor(activity.type);

                                return (
                                    <div
                                        key={activity.id}
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
                                            <p className="text-sm text-dark-200 truncate">{activity.title}</p>
                                            <p className="text-xs text-dark-500">{activity.company}</p>
                                            <p className="text-xs text-dark-600 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Recommended Jobs */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-dark-100">Recommended Jobs</h3>
                        <Badge variant="primary" dot>
                            {jobs.length} new matches
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        {jobs.slice(0, 3).map((job, index) => (
                            <div
                                key={job.id}
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
