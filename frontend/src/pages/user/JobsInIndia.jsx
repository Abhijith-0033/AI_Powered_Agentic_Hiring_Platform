import { MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { JobCard } from '../../components/shared';
import { Button, Input } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import { getJobsInIndia } from '../../api/jobs';

const JobsInIndia = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const result = await getJobsInIndia();
                if (result.success) {
                    setJobs(result.data);
                }
            } catch (error) {
                console.error('Error fetching external jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            job.job_title?.toLowerCase().includes(query) ||
            job.external_company_name?.toLowerCase().includes(query) ||
            job.job_description?.toLowerCase().includes(query)
        );
    });

    const handleApplyClick = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <DashboardLayout type="user" title="Jobs in India">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Jobs in India (External)
                    </h2>
                    <p className="text-dark-400">
                        {loading ? 'Loading...' : `${filteredJobs.length} opportunities found from Adzuna`}
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Input
                        placeholder="Search external jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="w-5 h-5" />}
                    />
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-12 text-dark-400">Loading jobs...</div>
                ) : filteredJobs.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredJobs.map((job, index) => (
                            <div
                                key={job.job_id} // Intentionally using internal ID if stored, or external_job_id
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Card className="hover:border-primary-500/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-dark-100 mb-2">
                                                    {job.job_title}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 text-sm text-dark-400 mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {job.location}
                                                    </span>
                                                    <span className="font-medium text-primary-400">
                                                        {job.external_company_name || 'External Company'}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs border border-purple-500/20">
                                                        External Job
                                                    </span>
                                                </div>
                                                <p className="text-dark-300 line-clamp-2 mb-4">
                                                    {job.job_description}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleApplyClick(job.source_url)}
                                            >
                                                Apply on Company Site
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Search className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-dark-200 mb-2">No jobs found</h3>
                            <p className="text-dark-400">
                                Try adjusting your search query.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default JobsInIndia;
