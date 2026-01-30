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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
            <div className="mb-8 relative overflow-hidden rounded-xl bg-white border border-neutral-200 shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Building2 className="w-64 h-64 text-primary-600" />
                </div>

                <div className="relative z-10 p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                    {company?.logo ? (
                        <img
                            src={company.logo}
                            alt={company.name}
                            className="w-24 h-24 rounded-2xl object-cover border border-neutral-200 shadow-sm"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100">
                            <Building2 className="w-10 h-10 text-primary-600" />
                        </div>
                    )}

                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                            Welcome back, {company?.name || user?.name || 'Recruiter'}! 👋
                        </h2>

                        <div className="flex flex-wrap items-center gap-6 text-neutral-600">
                            <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
                                <Mail className="w-4 h-4 text-primary-600" />
                                <span className="text-sm font-medium">{user?.email}</span>
                            </div>

                            {company?.location && (
                                <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
                                    <MapPin className="w-4 h-4 text-neutral-500" />
                                    <span className="text-sm font-medium">{company.location}</span>
                                </div>
                            )}

                            {company?.industry && (
                                <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
                                    <Briefcase className="w-4 h-4 text-neutral-500" />
                                    <span className="text-sm font-medium">{company.industry}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!company && (
                        <Link to="/provider/company-profile">
                            <Button variant="primary" className="shadow-lg shadow-primary-500/20">Set Up Profile</Button>
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
                <Card className="border-neutral-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-neutral-900">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            Application Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={applicationTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="apps"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563eb', r: 4 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-neutral-900">
                            <Briefcase className="w-5 h-5 text-primary-600" />
                            Job Posting Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={jobsPostedData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Bar dataKey="jobs" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
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
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-center">
                                    <p className="text-amber-800 mb-2 font-medium">Company Profile Missing</p>
                                    <p className="text-sm text-neutral-600 mb-3">You need to set up your profile before your jobs can be properly indexed.</p>
                                </div>
                            )}

                            {recentJobs.length > 0 ? (
                                recentJobs.map((job) => (
                                    <div
                                        key={job.job_id}
                                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-white transition-all duration-200"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-neutral-900">{job.job_title}</h4>
                                                <Badge
                                                    variant={job.status === 'Open' ? 'success' : 'warning'}
                                                    size="sm"
                                                >
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-neutral-500">
                                                {job.experience_level} • {job.location || 'Remote'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-neutral-500">Posted {new Date(job.created_at).toLocaleDateString()}</p>
                                            <Link to={`/jobs/${job.job_id}`} className="text-primary-600 text-xs hover:underline font-medium">View Details</Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-neutral-500">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
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
