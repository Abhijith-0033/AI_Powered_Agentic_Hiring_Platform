import { MapPin, Search, SlidersHorizontal, Wifi, X } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { JobCard } from '../../components/shared';
import { Badge, Button, Input, Select, Toggle } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import { jobs } from '../../mockData/jobs';

/**
 * Job Discovery page
 * Search and filter job listings
 */
const JobDiscovery = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        role: '',
        experience: '',
        location: '',
        remote: false,
    });
    const [showFilters, setShowFilters] = useState(false);

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
        { value: '0-2', label: '0-2 years' },
        { value: '3-5', label: '3-5 years' },
        { value: '5+', label: '5+ years' },
        { value: '10+', label: '10+ years' },
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

    // Filter jobs based on search and filters (UI only - mock filtering)
    const filteredJobs = jobs.filter(job => {
        if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.remote && !job.remote) {
            return false;
        }
        return true;
    });

    return (
        <DashboardLayout type="user" title="Job Discovery">
            <div className="max-w-6xl mx-auto">
                {/* Search Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Discover Your Next Opportunity
                    </h2>
                    <p className="text-dark-400">
                        {filteredJobs.length} jobs matching your profile
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
                {filteredJobs.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredJobs.map((job, index) => (
                            <div
                                key={job.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <JobCard job={job} />
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
        </DashboardLayout>
    );
};

export default JobDiscovery;
