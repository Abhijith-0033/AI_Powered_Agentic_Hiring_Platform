import { Search, Users } from 'lucide-react';
import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { ApplicantCard, CandidateProfilePanel } from '../../components/shared';
import ApplicantDetailsModal from '../../components/shared/ApplicantDetailsModal';
import { Input, Select } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import { getAllRecruiterApplications, updateApplicationStatus } from '../../api/applications';

/**
 * Applicant Management page
 * View and manage job applicants
 */
const ApplicantManagement = () => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState('all');

    // Modal State
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Profile Panel State (NEW)
    const [profilePanelOpen, setProfilePanelOpen] = useState(false);
    const [profilePanelAppId, setProfilePanelAppId] = useState(null);
    const [profilePanelCandidateName, setProfilePanelCandidateName] = useState('');

    // Fetch applicants from API
    const fetchApplicants = async () => {
        try {
            const result = await getAllRecruiterApplications();
            if (result.success) {
                // Map DB snake_case to Comp camelCase
                const mapped = result.data.map(app => ({
                    id: app.id,
                    name: app.candidate_name,
                    email: app.candidate_email,
                    avatar: app.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.candidate_name)}`,
                    title: 'Candidate', // Could be inferred from experience or resume
                    location: 'Unknown', // Not currently queried, add to query later if needed
                    experience: app.experience ? `${app.experience} years` : 'N/A',
                    skills: app.skills ? (typeof app.skills === 'string' ? app.skills.split(',') : []) : [],
                    appliedFor: app.job_title,
                    appliedDate: new Date(app.applied_at).toLocaleDateString(),
                    status: app.status || 'new',
                    matchScore: Math.floor(Math.random() * 40) + 60, // Mock AI score for now
                    source: 'Platform',
                    // Keep raw data for modal
                    ...app
                }));
                setApplicants(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch applicants:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchApplicants();
    }, []);

    const handleUpdateStatus = async (appId, newStatus) => {
        // Optimistic Update
        const previousApps = [...applicants];
        setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));

        // Also update selectedApplicant if open
        if (selectedApplicant && selectedApplicant.id === appId) {
            setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
        }

        try {
            await updateApplicationStatus(appId, newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            setApplicants(previousApps); // Revert
            alert("Failed to update status");
        }
    };

    const handleViewDetails = (app) => {
        setSelectedApplicant(app);
        setIsModalOpen(true);
    };

    // Open Profile Panel (NEW)
    const handleViewProfile = (app) => {
        setProfilePanelAppId(app.id);
        setProfilePanelCandidateName(app.name);
        setProfilePanelOpen(true);
    };

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'new', label: 'New' },
        { value: 'reviewing', label: 'Reviewing' },
        { value: 'shortlisted', label: 'Shortlisted' },
        { value: 'shortlisted_for_test', label: 'Test Scheduled' },
        { value: 'interview', label: 'Interview' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
    ];

    // Get unique job titles for filter
    const uniqueJobs = Array.from(new Set(applicants.map(a => a.appliedFor || 'General Pool')));
    const jobOptions = [
        { value: 'all', label: 'All Jobs' },
        ...uniqueJobs.map(job => ({ value: job, label: job }))
    ];

    const filteredApplicants = applicants.filter(applicant => {
        if (searchQuery && !applicant.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        // Case insensitive status match
        if (statusFilter !== 'all' && applicant.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
        }
        if (jobFilter !== 'all' && (applicant.appliedFor || 'General Pool') !== jobFilter) {
            return false;
        }
        return true;
    });

    const statusCounts = {
        all: applicants.length,
        new: applicants.filter(a => (a.status || 'applied').toLowerCase() === 'applied').length,
        shortlisted: applicants.filter(a => (a.status || '').toLowerCase() === 'shortlisted').length,
        shortlisted_for_test: applicants.filter(a => (a.status || '').toLowerCase() === 'shortlisted_for_test').length,
        interview: applicants.filter(a => (a.status || '').toLowerCase() === 'interview').length,
        accepted: applicants.filter(a => (a.status || '').toLowerCase() === 'accepted').length,
        rejected: applicants.filter(a => (a.status || '').toLowerCase() === 'rejected').length,
    };

    if (loading) {
        return (
            <DashboardLayout type="provider" title="Applicants">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="provider" title="Applicants">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                        Applicant Management
                    </h2>
                    <p className="text-neutral-500">
                        Review and manage candidates for your open positions.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {[
                        { label: 'All', value: statusCounts.all, active: statusFilter === 'all', id: 'all' },
                        { label: 'Applied', value: statusCounts.new, active: statusFilter === 'applied', color: 'info', id: 'applied' },
                        { label: 'Shortlisted', value: statusCounts.shortlisted, active: statusFilter === 'shortlisted', color: 'success', id: 'shortlisted' },
                        { label: 'Test', value: statusCounts.shortlisted_for_test, active: statusFilter === 'shortlisted_for_test', color: 'warning', id: 'shortlisted_for_test' },
                        { label: 'Interview', value: statusCounts.interview, active: statusFilter === 'interview', color: 'warning', id: 'interview' },
                        { label: 'Accepted', value: statusCounts.accepted, active: statusFilter === 'accepted', color: 'success', id: 'accepted' },
                        { label: 'Rejected', value: statusCounts.rejected, active: statusFilter === 'rejected', color: 'error', id: 'rejected' },
                    ].map((stat) => (
                        <button
                            key={stat.id}
                            onClick={() => setStatusFilter(stat.id)}
                            className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border
                ${stat.active
                                    ? 'bg-primary-50 text-primary-600 border-primary-200 ring-2 ring-primary-100'
                                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'}
              `}
                        >
                            {stat.label} ({stat.value})
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <Card className="mb-6 shadow-sm">
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
                        <p className="text-sm text-neutral-500">
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
                                    onViewResume={() => handleViewDetails(applicant)}
                                    onViewProfile={() => handleViewProfile(applicant)}
                                    onShortlist={(customStatus) => handleUpdateStatus(applicant.id, customStatus || 'shortlisted')}
                                    onInterview={() => handleUpdateStatus(applicant.id, 'interview')}
                                    onAccept={() => handleUpdateStatus(applicant.id, 'accepted')}
                                    onReject={() => handleUpdateStatus(applicant.id, 'rejected')}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No applicants found</h3>
                            <p className="text-neutral-500">
                                Try adjusting your search or filter criteria
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <ApplicantDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                applicant={selectedApplicant}
                onUpdateStatus={handleUpdateStatus}
            />

            {/* Candidate Profile Side Panel (NEW) */}
            <CandidateProfilePanel
                applicationId={profilePanelAppId}
                isOpen={profilePanelOpen}
                onClose={() => setProfilePanelOpen(false)}
                candidateName={profilePanelCandidateName}
            />
        </DashboardLayout>
    );
};

export default ApplicantManagement;
