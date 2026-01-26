import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Building2,
    MapPin,
    Mail,
    Plus,
    ArrowRight,
    Users,
    Target,
    Clock,
    TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Badge } from '../../components/ui';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../api/axios';
import { MetricCard } from '../../components/shared';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

/**
 * Provider Dashboard page
 * Shows company overview and actions
 */
const ProviderDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/provider/stats');
                if (response.data.success) {
                    setDashboardData(response.data);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout type="provider" title="Dashboard">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    const company = dashboardData?.company;
    const user = dashboardData?.user;
    const stats = dashboardData?.stats;
    const recentJobs = dashboardData?.recentJobs || [];

    // Mock data for charts (since historical data table missing)
    const applicationTrendData = [
        { name: 'Mon', apps: 4 },
        { name: 'Tue', apps: 7 },
        { name: 'Wed', apps: 5 },
        { name: 'Thu', apps: 12 },
        { name: 'Fri', apps: 9 },
        { name: 'Sat', apps: 3 },
        { name: 'Sun', apps: 2 },
    ];

    const jobsPostedData = [
        { name: 'Jan', jobs: 2 },
        { name: 'Feb', jobs: 5 },
        { name: 'Mar', jobs: 3 },
        { name: 'Apr', jobs: stats?.jobsPosted || 4 }, // Use real total for current month conceptually
    ];

    return (
        <DashboardLayout type="provider" title="Dashboard">
            {/* 1. Header / Welcome Card */}
            <div className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-dark-800 to-dark-700 border border-dark-600 shadow-lg glow-border">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Building2 className="w-64 h-64 text-primary-500" />
                </div>

                <div className="relative z-10 p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                    {company?.logo ? (
                        <img
                            src={company.logo}
                            alt={company.name}
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-dark-500 shadow-xl"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center border border-dark-500">
                            <Building2 className="w-10 h-10 text-primary-400" />
                        </div>
                    )}

                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-white mb-3">
                            Welcome back, {company?.name || user?.name || 'Recruiter'}! 👋
                        </h2>

                        <div className="flex flex-wrap items-center gap-6 text-dark-300">
                            <div className="flex items-center gap-2 bg-dark-900/40 px-3 py-1.5 rounded-lg border border-dark-600/50">
                                <Mail className="w-4 h-4 text-primary-400" />
                                <span className="text-sm font-medium">{user?.email}</span>
                            </div>

                            {company?.location && (
                                <div className="flex items-center gap-2 bg-dark-900/40 px-3 py-1.5 rounded-lg border border-dark-600/50">
                                    <MapPin className="w-4 h-4 text-secondary-400" />
                                    <span className="text-sm font-medium">{company.location}</span>
                                </div>
                            )}

                            {company?.industry && (
                                <div className="flex items-center gap-2 bg-dark-900/40 px-3 py-1.5 rounded-lg border border-dark-600/50">
                                    <Briefcase className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-medium">{company.industry}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!company && (
                        <Link to="/provider/company-profile">
                            <Button variant="primary" className="shadow-glow">Set Up Profile</Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* 3. Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Jobs Posted"
                    value={stats?.jobsPosted || 0}
                    change="live"
                    trend="neutral"
                    icon={Briefcase}
                    color="primary"
                />
                <MetricCard
                    title="Total Applicants"
                    value={stats?.applicants || 0}
                    change="total"
                    trend="neutral"
                    icon={Users}
                    color="secondary"
                />
                <MetricCard
                    title="Shortlisted"
                    value={stats?.shortlisted || 0}
                    change="candidates"
                    trend="neutral"
                    icon={Target}
                    color="success"
                />
                <MetricCard
                    title="Interviews"
                    value={stats?.interviewed || 0}
                    change="scheduled"
                    trend="neutral"
                    icon={Clock}
                    color="warning"
                />
            </div>

            {/* 4. Analytics Section */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <Card className="border-dark-700 bg-dark-800/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-400" />
                            Application Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={applicationTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1C1C24', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="apps"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        dot={{ fill: '#8B5CF6', r: 4 }}
                                        activeDot={{ r: 6, fill: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-dark-700 bg-dark-800/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-secondary-400" />
                            Job Posting Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={jobsPostedData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#FFFFFF05' }}
                                        contentStyle={{ backgroundColor: '#1C1C24', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="jobs" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Recent Jobs */}
            <div className="grid lg:grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Active Jobs</CardTitle>
                            <Link to="/provider/post-job">
                                <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                                    Post New Job
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {!company && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4 text-center">
                                    <p className="text-yellow-500 mb-2 font-medium">Company Profile Missing</p>
                                    <p className="text-sm text-dark-300 mb-3">You need to set up your profile before your jobs can be properly indexed.</p>
                                </div>
                            )}

                            {recentJobs.length > 0 ? (
                                recentJobs.map((job) => (
                                    <div
                                        key={job.job_id}
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
                                            <p className="text-sm text-dark-300">Posted {new Date(job.created_at).toLocaleDateString()}</p>
                                            <Link to={`/jobs/${job.job_id}`} className="text-primary-400 text-xs hover:underline">View Details</Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-dark-400">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No active jobs found for {company?.name || 'your company'}.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ProviderDashboard;
