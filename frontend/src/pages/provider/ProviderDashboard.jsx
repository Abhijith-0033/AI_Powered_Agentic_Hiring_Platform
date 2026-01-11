import React, { useState, useEffect } from 'react';
import {
    ArrowRight,
    Briefcase,
    Clock,
    Target,
    TrendingUp,
    Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { MetricCard } from '../../components/shared';
import { Badge, Button } from '../../components/ui';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * Provider Dashboard page
 * Shows hiring metrics, posted jobs, and recent applicants
 */
const ProviderDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsRes, appsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/jobs'),
                    fetch('http://localhost:3000/api/applications')
                ]);

                const jobsData = await jobsRes.json();
                const appsData = await appsRes.json();

                if (jobsData.success) setJobs(jobsData.data);
                if (appsData.success) setApplicants(appsData.data);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate dynamic stats
    const providerDashboardStats = {
        jobsPosted: jobs.length,
        totalApplicants: applicants.length,
        shortlisted: applicants.filter(a => a.status === 'shortlisted').length,
        pendingReview: applicants.filter(a => a.status === 'new' || a.status === 'reviewing').length,
        interviewed: applicants.filter(a => a.status === 'interview').length,
        hired: applicants.filter(a => a.status === 'hired').length
    };

    return (
        <DashboardLayout type="provider" title="Dashboard">
            {/* Welcome Message */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark-100 mb-2">
                    Welcome back, TechCorp! 👋
                </h2>
                <p className="text-dark-400">
                    Here's your hiring overview for today.
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Jobs Posted"
                    value={providerDashboardStats.jobsPosted}
                    change="+2"
                    trend="up"
                    icon={Briefcase}
                    color="primary"
                />
                <MetricCard
                    title="Total Applicants"
                    value={providerDashboardStats.totalApplicants}
                    change="+45"
                    trend="up"
                    icon={Users}
                    color="secondary"
                />
                <MetricCard
                    title="Shortlisted"
                    value={providerDashboardStats.shortlisted}
                    change="+12"
                    trend="up"
                    icon={Target}
                    color="success"
                />
                <MetricCard
                    title="Pending Review"
                    value={providerDashboardStats.pendingReview}
                    change="-8"
                    trend="down"
                    icon={Clock}
                    color="warning"
                />
            </div>

            {/* Charts Placeholder */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 bg-dark-700/30 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-dark-500 mx-auto mb-2" />
                                <p className="text-dark-400">Application trend chart</p>
                                <p className="text-sm text-dark-500">(Chart visualization placeholder)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hiring Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { stage: 'Applied', count: providerDashboardStats.totalApplicants, color: 'bg-sky-500' },
                                { stage: 'Shortlisted', count: providerDashboardStats.shortlisted, color: 'bg-amber-500' },
                                { stage: 'Interviewed', count: providerDashboardStats.interviewed, color: 'bg-primary-500' },
                                { stage: 'Hired', count: providerDashboardStats.hired, color: 'bg-emerald-500' },
                            ].map((item) => (
                                <div key={item.stage} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-dark-400">{item.stage}</div>
                                    <div className="flex-1 h-8 bg-dark-700 rounded-lg overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} transition-all duration-500`}
                                            style={{ width: `${(item.count / providerDashboardStats.totalApplicants) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-right font-medium text-dark-200">{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Active Jobs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Active Jobs</CardTitle>
                            <Link to="/provider/post-job">
                                <Button variant="outline" size="sm">
                                    Post New Job
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {jobs.slice(0, 4).map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-dark-100">{job.job_title}</h4>
                                            <Badge
                                                variant={job.status === 'Open' ? 'success' : 'warning'}
                                                size="sm"
                                            >
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-dark-400">
                                            {job.experience_level} • {job.location || 'Remote'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-primary-400">0</p>
                                        <p className="text-xs text-dark-500">applicants</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Applicants */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Applicants</CardTitle>
                            <Link to="/provider/applicants">
                                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {applicants.slice(0, 4).map((applicant) => (
                                <div
                                    key={applicant.id}
                                    className="flex items-center gap-4 p-4 bg-dark-700/30 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                                >
                                    <img
                                        src={applicant.avatar}
                                        alt={applicant.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-dark-100 truncate">{applicant.name}</h4>
                                        <p className="text-sm text-dark-400 truncate">{applicant.appliedFor}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className={`
                      px-2 py-1 rounded-lg text-xs font-semibold
                      ${applicant.matchScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                                                applicant.matchScore >= 75 ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-dark-600 text-dark-300'}
                    `}>
                                            {applicant.matchScore}% match
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ProviderDashboard;
