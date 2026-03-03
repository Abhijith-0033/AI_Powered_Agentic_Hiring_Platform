import React, { useState, useEffect } from 'react';
import { Users, Briefcase, FileText, Activity } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { MetricCard } from '../../components/shared';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/ui';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        jobs: 0,
        applications: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats from backend if available, or just mock for now until backend is re-added
                const [usersRes, jobsRes, appsRes] = await Promise.all([
                    api.get('/admin/users').catch(() => ({ data: { count: 0 } })),
                    api.get('/admin/jobs').catch(() => ({ data: { count: 0 } })),
                    api.get('/admin/applications').catch(() => ({ data: { count: 0 } }))
                ]);

                setStats({
                    users: usersRes?.data?.count || 0,
                    jobs: jobsRes?.data?.count || 0,
                    applications: appsRes?.data?.count || 0
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <DashboardLayout type="admin" title="Admin Dashboard">
                <LoadingSpinner size="md" color="text-primary-600" className="h-64" />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="admin" title="Admin Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    title="Total Users"
                    value={stats.users}
                    icon={Users}
                    color="primary"
                    change="System-wide"
                />
                <MetricCard
                    title="Total Jobs"
                    value={stats.jobs}
                    icon={Briefcase}
                    color="secondary"
                    change="Active & Closed"
                />
                <MetricCard
                    title="Applications"
                    value={stats.applications}
                    icon={FileText}
                    color="success"
                    change="Submitted"
                />
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-50 rounded-lg">
                        <Activity className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">System Overview</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <p className="text-neutral-600">
                            Welcome to the Super Admin Dashboard. From here you can manage all users,
                            monitor job postings, and oversee the application process across the entire platform.
                        </p>
                        <ul className="space-y-2 text-neutral-700">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                Monitor user verification status
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                Soft-delete inactive or problematic accounts
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                Impersonate users for debugging purposes
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
