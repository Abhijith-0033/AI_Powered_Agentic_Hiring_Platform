import { MapPin, Search, SlidersHorizontal, Trash2, X, Briefcase, Clock, GraduationCap } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Input, Badge } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import { getJobsInIndia } from '../../api/jobs';

const JobsInIndia = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Context for pagination
    const page = searchParams.get('page') || '1';

    // Local state for immediate typing (prevents focus loss)
    const [localFilters, setLocalFilters] = useState({
        role: searchParams.get('role') || '',
        location: searchParams.get('location') || '',
        type: searchParams.get('type') || '',
        experience: searchParams.get('experience') || ''
    });

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            // Explicitly build filters from searchParams to ensure server-side truth
            const currentFilters = {
                role: searchParams.get('role') || '',
                location: searchParams.get('location') || '',
                type: searchParams.get('type') || '',
                experience: searchParams.get('experience') || '',
                page: searchParams.get('page') || '1'
            };

            console.log('Fetching with server-side filters:', currentFilters);
            const result = await getJobsInIndia(currentFilters);
            if (result.success) {
                // Strict replacement: This list comes directly from the server's SQL response
                setJobs(result.data);
                setTotal(result.total || result.count);
            }
        } catch (error) {
            console.error('Error in server-side fetch:', error);
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    // Handle debounced URL updates
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            let hasChanged = false;

            Object.entries(localFilters).forEach(([key, value]) => {
                if (params.get(key) !== (value || '')) {
                    if (value) params.set(key, value);
                    else params.delete(key);
                    hasChanged = true;
                }
            });

            if (hasChanged) {
                params.set('page', '1'); // Reset to first page when filtering
                setSearchParams(params);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localFilters, setSearchParams, searchParams]);

    // Fetch jobs ONLY when searchParams change (this is the single trigger for data)
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Update local state immediately
    const handleFilterChange = (updates) => {
        setLocalFilters(prev => ({ ...prev, ...updates }));
    };

    const handleClearFilters = () => {
        setLocalFilters({ role: '', location: '', type: '', experience: '' });
        setSearchParams(new URLSearchParams());
    };

    const handleApplyClick = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const experienceLevels = [
        { label: 'Any Experience', value: '' },
        { label: 'Fresher (0-1y)', value: 'fresher' },
        { label: 'Junior (1-3y)', value: 'junior' },
        { label: 'Mid (3-6y)', value: 'mid' },
        { label: 'Senior (6+y)', value: 'senior' },
    ];

    const jobTypes = [
        { label: 'Any Type', value: '' },
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
        { label: 'Remote', value: 'remote' },
    ];

    const filterForm = (
        <div className="space-y-6">
            <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-2 font-sans uppercase tracking-tight opacity-70">Role</label>
                <Input
                    placeholder="Search by title..."
                    value={localFilters.role}
                    onChange={(e) => handleFilterChange({ role: e.target.value })}
                    leftIcon={<Search className="w-4 h-4" />}
                    size="sm"
                />
            </div>

            <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-2 font-sans uppercase tracking-tight opacity-70">Location</label>
                <Input
                    placeholder="City or state..."
                    value={localFilters.location}
                    onChange={(e) => handleFilterChange({ location: e.target.value })}
                    leftIcon={<MapPin className="w-4 h-4" />}
                    size="sm"
                />
            </div>

            <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-2 px-1 font-sans uppercase tracking-tight opacity-70">Job Type</label>
                <div className="space-y-1">
                    {jobTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => handleFilterChange({ type: type.value })}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors font-sans ${localFilters.type === type.value
                                ? 'bg-primary-50 text-primary-600 font-bold border border-primary-100'
                                : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-2 px-1 font-sans uppercase tracking-tight opacity-70">Experience</label>
                <div className="space-y-1">
                    {experienceLevels.map((exp) => (
                        <button
                            key={exp.value}
                            onClick={() => handleFilterChange({ experience: exp.value })}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors font-sans ${localFilters.experience === exp.value
                                ? 'bg-primary-50 text-primary-600 font-bold border border-primary-100'
                                : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            {exp.label}
                        </button>
                    ))}
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleClearFilters}
                className="mt-4 font-bold tracking-wide"
            >
                Clear All
            </Button>
        </div>
    );

    return (
        <DashboardLayout type="user" title="Jobs in India">
            <div className="max-w-7xl mx-auto px-4 font-sans">
                {/* Mobile Header & Filter Toggle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-neutral-200 pb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                            Explore Career Opportunities
                        </h2>
                        <p className="text-neutral-500 text-sm mt-1 font-medium">
                            {loading ? 'Refreshing list...' : `${total} jobs found across India (Real-time tracking)`}
                        </p>
                    </div>
                    <Button
                        className="md:hidden shadow-lg"
                        variant="secondary"
                        leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                        onClick={() => setShowMobileFilters(true)}
                    >
                        Adjust Filters
                    </Button>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Desktop Sidebar Filters */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24">
                            <Card className="bg-white border-neutral-200 shadow-xl">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
                                        <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                                        <h3 className="font-bold text-neutral-900 uppercase tracking-widest text-[11px]">Server-Side Filters</h3>
                                    </div>
                                    {filterForm}
                                </CardContent>
                            </Card>
                        </div>
                    </aside>

                    {/* Job List Area */}
                    <div className="lg:col-span-3">
                        {/* Active Filter Chips */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {Object.entries(localFilters).map(([key, value]) => {
                                if (!value) return null;
                                return (
                                    <Badge
                                        key={key}
                                        variant="primary"
                                        className="flex items-center gap-2 px-3 py-1.5 border-primary-100 bg-primary-50 text-primary-600 rounded-lg shadow-sm"
                                    >
                                        <span className="capitalize text-[10px] font-black uppercase tracking-tighter opacity-60 mr-1">{key}</span>
                                        <span className="text-xs font-bold tracking-wide">{value}</span>
                                        <button onClick={() => handleFilterChange({ [key]: '' })} className="ml-1 p-0.5 hover:bg-primary-100 rounded-full transition-all">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>

                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map(i => (
                                    <Card key={i} className="animate-pulse bg-neutral-100 border-neutral-200 h-44 rounded-xl" />
                                ))}
                            </div>
                        ) : jobs.length > 0 ? (
                            <div className="grid gap-6">
                                {jobs.map((job, index) => (
                                    <Card
                                        key={job.job_id || index}
                                        className="group hover:border-primary-200 transition-all duration-300 bg-white shadow-md border-neutral-200 rounded-xl overflow-hidden"
                                    >
                                        <CardContent className="p-8">
                                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-8">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                                        <h3 className="text-2xl font-black text-neutral-900 group-hover:text-primary-600 transition-colors tracking-tight leading-none">
                                                            {job.job_title}
                                                        </h3>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-purple-200 bg-purple-50 text-purple-600 px-2.5 py-1">
                                                            External Job
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap gap-y-4 gap-x-8 text-[14px] mb-6">
                                                        <div className="flex items-center gap-2.5 text-neutral-700">
                                                            <Briefcase className="w-5 h-5 text-primary-600" />
                                                            <span className="font-extrabold text-primary-600 tracking-wide uppercase">
                                                                {job.external_company_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-neutral-600 font-bold">
                                                            <MapPin className="w-5 h-5 text-neutral-400" />
                                                            {job.location}
                                                        </div>
                                                        {job.job_type && (
                                                            <div className="flex items-center gap-2.5 text-neutral-600 font-bold">
                                                                <Clock className="w-5 h-5 text-neutral-400" />
                                                                {job.job_type}
                                                            </div>
                                                        )}
                                                        {job.experience_level && (
                                                            <div className="flex items-center gap-2.5 text-neutral-600 font-bold">
                                                                <GraduationCap className="w-5 h-5 text-neutral-400" />
                                                                {job.experience_level}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-neutral-500 line-clamp-2 leading-relaxed mb-4 text-base font-medium opacity-90">
                                                        {job.job_description}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        onClick={() => handleApplyClick(job.source_url)}
                                                        className="shadow-xl shadow-primary-500/20 whitespace-nowrap font-black uppercase tracking-widest h-12 rounded-lg"
                                                    >
                                                        Apply on {job.source_name === 'jooble' ? 'Jooble' : 'Adzuna'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-neutral-50 border-dashed border-neutral-300 rounded-3xl">
                                <CardContent className="py-32 text-center">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-neutral-100">
                                        <Search className="w-12 h-12 text-neutral-400" />
                                    </div>
                                    <h3 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">No match found on the server</h3>
                                    <p className="text-neutral-500 max-w-sm mx-auto mb-10 font-bold leading-relaxed">
                                        The database returned zero records for your current filter combination.
                                        Try broadening your criteria.
                                    </p>
                                    <Button variant="outline" size="lg" onClick={handleClearFilters} className="font-black px-12 h-14 rounded-xl">
                                        Display All Jobs
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pagination */}
                        {total > 10 && (
                            <div className="mt-16 flex items-center justify-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="md"
                                    disabled={page === '1'}
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams);
                                        params.set('page', (parseInt(page) - 1).toString());
                                        setSearchParams(params);
                                    }}
                                    className="px-6 font-bold"
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center justify-center px-8 h-12 bg-white rounded-xl font-black text-sm text-neutral-900 min-w-[120px] shadow-sm border border-neutral-200">
                                    PAGE {page}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="md"
                                    disabled={jobs.length < 10}
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams);
                                        params.set('page', (parseInt(page) + 1).toString());
                                        setSearchParams(params);
                                    }}
                                    className="px-6 font-bold"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-neutral-200 p-10 flex flex-col animate-slide-in-right shadow-2xl">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">Filters</h3>
                                <p className="text-[10px] text-primary-600 mt-1 uppercase font-black tracking-[0.3em]">Hiring Platform</p>
                            </div>
                            <button onClick={() => setShowMobileFilters(false)} className="p-3 text-neutral-500 hover:text-neutral-900 transition-all bg-neutral-100 rounded-xl shadow-sm">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {filterForm}
                        </div>
                        <Button className="mt-10 font-black h-14 shadow-xl shadow-primary-500/20 rounded-xl uppercase tracking-widest text-sm" fullWidth onClick={() => setShowMobileFilters(false)}>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default JobsInIndia;
