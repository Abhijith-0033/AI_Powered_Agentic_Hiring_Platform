import { MapPin, Search, SlidersHorizontal, Wifi, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { JobCard } from '../../components/shared';
import JobApplyModal from '../../components/shared/JobApplyModal';
import { Badge, Button, Input, Select, Toggle } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import { getJobs } from '../../api/jobs';
import { getUserApplications } from '../../api/applications';

/**
 * Job Discovery page
 * Search and filter job listings
 */
const JobDiscovery = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        role: '',
        experience: '',
        location: '',
        remote: false,
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                // Fetch all open jobs first
                // In a real app, we'd pass filters to the API
                const result = await getJobs({ status: 'Open' });
                if (result.success) {
                    setJobs(result.data);
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const roleOptions = [
        { value: '', label: 'All Roles' },
        { value: 'frontend', label: 'Frontend Developer' },
        { value: 'backend', label: 'Backend Developer' },
        { value: 'fullstack', label: 'Full Stack Developer' },
        { value: 'ml', label: 'Machine Learning Engineer' },
        { value: 'devops', label: 'DevOps Engineer' },
        { value: 'design', label: 'Product Designer' },
    ];

    const experienceOptions = [
        { value: '', label: 'Any Experience' },
        { value: 'entry', label: 'Entry Level' },
        { value: 'mid', label: 'Mid Level' },
        { value: 'senior', label: 'Senior Level' },
        { value: 'lead', label: 'Lead/Staff' },
    ];

    const locationOptions = [
        { value: '', label: 'Any Location' },
        { value: 'san francisco', label: 'San Francisco, CA' },
        { value: 'new york', label: 'New York, NY' },
        { value: 'seattle', label: 'Seattle, WA' },
        { value: 'austin', label: 'Austin, TX' },
        { value: 'boston', label: 'Boston, MA' },
    ];

    const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== false).length;

    const clearFilters = () => {
        setFilters({
            role: '',
            experience: '',
            location: '',
            remote: false,
        });
    };

    // Client-side filtering
    const filteredJobs = jobs.filter(job => {
        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = job.job_title?.toLowerCase().includes(query);
            const matchesDesc = job.job_description?.toLowerCase().includes(query);
            const matchesSkills = job.required_skills?.toLowerCase().includes(query);

            if (!matchesTitle && !matchesDesc && !matchesSkills) {
                return false;
            }
        }

        // Filters
        if (filters.role && !job.job_title.toLowerCase().includes(filters.role)) {
            return false;
        }
        if (filters.experience && !job.experience_level.toLowerCase().includes(filters.experience)) {
            return false;
        }
        if (filters.location && !job.location?.toLowerCase().includes(filters.location)) {
            return false;
        }
        if (filters.remote && job.location?.toLowerCase() !== 'remote') { // Assuming remote is stored in location or job_type
            // If we had a specific boolean for remote, we'd check that. 
            // For now, let's assume remote might be in location.
            const isRemote = job.location?.toLowerCase().includes('remote') || job.job_type?.toLowerCase().includes('remote');
            if (!isRemote) return false;
        }

        return true;
    });

    const [selectedJob, setSelectedJob] = useState(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [userApplications, setUserApplications] = useState([]);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await getUserApplications();
                if (res.success) {
                    setUserApplications(res.applications || []);
                }
            } catch (err) {
                console.error("Failed to fetch user applications", err);
            }
        };
        fetchApplications();
    }, [isApplyModalOpen]); // Refetch when modal closes (application submitted)

    const handleApplyClick = (job) => {
        setSelectedJob(job);
        setIsApplyModalOpen(true);
    };

    return (
        <DashboardLayout type="user" title="Job Discovery">
            <div className="max-w-6xl mx-auto">
                {/* Search Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Discover Your Next Opportunity
                    </h2>
                    <p className="text-dark-400">
                        {loading ? 'Loading jobs...' : `${filteredJobs.length} jobs available`}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search jobs by title, company, or skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <Button
                        variant={showFilters ? 'primary' : 'secondary'}
                        onClick={() => setShowFilters(!showFilters)}
                        leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                    >
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <Card className="mb-6 animate-slide-up">
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-dark-100">Filters</h3>
                                {activeFiltersCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                <Select
                                    label="Role"
                                    options={roleOptions}
                                    value={filters.role}
                                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                                />
                                <Select
                                    label="Experience"
                                    options={experienceOptions}
                                    value={filters.experience}
                                    onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
                                />
                                <Select
                                    label="Location"
                                    options={locationOptions}
                                    value={filters.location}
                                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                />
                                <div className="flex items-end pb-2">
                                    <Toggle
                                        label="Remote Only"
                                        checked={filters.remote}
                                        onChange={(checked) => setFilters(prev => ({ ...prev, remote: checked }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Active Filters Tags */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {filters.role && (
                            <Badge variant="primary" className="flex items-center gap-1">
                                {roleOptions.find(r => r.value === filters.role)?.label}
                                <button onClick={() => setFilters(prev => ({ ...prev, role: '' }))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                        {filters.experience && (
                            <Badge variant="primary" className="flex items-center gap-1">
                                {filters.experience} experience
                                <button onClick={() => setFilters(prev => ({ ...prev, experience: '' }))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                        {filters.location && (
                            <Badge variant="primary" className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {locationOptions.find(l => l.value === filters.location)?.label}
                                <button onClick={() => setFilters(prev => ({ ...prev, location: '' }))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                        {filters.remote && (
                            <Badge variant="success" className="flex items-center gap-1">
                                <Wifi className="w-3 h-3" />
                                Remote
                                <button onClick={() => setFilters(prev => ({ ...prev, remote: false }))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}

                {/* Job Results */}
                {loading ? (
                    <div className="text-center py-12 text-dark-400">Loading jobs...</div>
                ) : filteredJobs.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredJobs.map((job, index) => (
                            <div
                                key={job.job_id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <JobCard
                                    job={job}
                                    isApplied={userApplications.some(app => app.job_id === job.job_id)}
                                    onApply={() => handleApplyClick(job)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Search className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-dark-200 mb-2">No jobs found</h3>
                            <p className="text-dark-400 mb-4">
                                Try adjusting your search criteria or filters
                            </p>
                            <Button variant="outline" onClick={clearFilters}>
                                Clear All Filters
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <JobApplyModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                job={selectedJob}
            />
        </DashboardLayout>
    );
};

export default JobDiscovery;
