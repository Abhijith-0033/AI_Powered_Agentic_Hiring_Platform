import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { ApplicantCard } from '../../components/shared';
import { Input, Select } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import { applicants } from '../../mockData/applicants';

/**
 * Applicant Management page
 * View and manage job applicants
 */
const ApplicantManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState('all');

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'new', label: 'New' },
        { value: 'reviewing', label: 'Reviewing' },
        { value: 'shortlisted', label: 'Shortlisted' },
        { value: 'interview', label: 'Interview' },
        { value: 'rejected', label: 'Rejected' },
    ];

    const jobOptions = [
        { value: 'all', label: 'All Jobs' },
        { value: 'Senior Frontend Developer', label: 'Senior Frontend Developer' },
        { value: 'Product Manager', label: 'Product Manager' },
        { value: 'DevOps Engineer', label: 'DevOps Engineer' },
        { value: 'UX Designer', label: 'UX Designer' },
    ];

    const filteredApplicants = applicants.filter(applicant => {
        if (searchQuery && !applicant.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (statusFilter !== 'all' && applicant.status !== statusFilter) {
            return false;
        }
        if (jobFilter !== 'all' && applicant.appliedFor !== jobFilter) {
            return false;
        }
        return true;
    });

    const statusCounts = {
        all: applicants.length,
        new: applicants.filter(a => a.status === 'new').length,
        shortlisted: applicants.filter(a => a.status === 'shortlisted').length,
        interview: applicants.filter(a => a.status === 'interview').length,
        rejected: applicants.filter(a => a.status === 'rejected').length,
    };

    return (
        <DashboardLayout type="provider" title="Applicants">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Applicant Management
                    </h2>
                    <p className="text-dark-400">
                        Review and manage candidates for your open positions.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {[
                        { label: 'All', value: statusCounts.all, active: statusFilter === 'all' },
                        { label: 'New', value: statusCounts.new, active: statusFilter === 'new', color: 'info' },
                        { label: 'Shortlisted', value: statusCounts.shortlisted, active: statusFilter === 'shortlisted', color: 'success' },
                        { label: 'Interview', value: statusCounts.interview, active: statusFilter === 'interview', color: 'warning' },
                        { label: 'Rejected', value: statusCounts.rejected, active: statusFilter === 'rejected', color: 'error' },
                    ].map((stat) => (
                        <button
                            key={stat.label}
                            onClick={() => setStatusFilter(stat.label.toLowerCase())}
                            className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${stat.active
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                                    : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-600'}
              `}
                        >
                            {stat.label} ({stat.value})
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Search applicants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <Select
                            options={jobOptions}
                            value={jobFilter}
                            onChange={(e) => setJobFilter(e.target.value)}
                            className="w-64"
                        />
                        <p className="text-sm text-dark-400">
                            Showing {filteredApplicants.length} applicants
                        </p>
                    </CardContent>
                </Card>

                {/* Applicants Grid */}
                {filteredApplicants.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredApplicants.map((applicant, index) => (
                            <div
                                key={applicant.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <ApplicantCard
                                    applicant={applicant}
                                    onViewResume={() => { }}
                                    onShortlist={() => { }}
                                    onReject={() => { }}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-dark-200 mb-2">No applicants found</h3>
                            <p className="text-dark-400">
                                Try adjusting your search or filter criteria
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ApplicantManagement;
