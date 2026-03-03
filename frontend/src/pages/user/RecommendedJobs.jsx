import {
    Briefcase,
    MapPin,
    ExternalLink,
    Sparkles,
    AlertCircle,
    RefreshCw,
    Search,
    Zap
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button, Badge } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';
import api from '../../api/axios';

const RecommendedJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/ai/recommended-jobs');
            if (response.data.success) {
                setJobs(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch recommendations.');
            }
        } catch (err) {
            console.error('[RecommendedJobs] Fetch error:', err);
            setError('Could not connect to the recommendation service. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleApplyClick = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <DashboardLayout type="user" title="AI Recommended Jobs">
            <div className="max-w-6xl mx-auto px-4 space-y-8 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
                                Recommended for You
                            </h2>
                            <p className="text-neutral-500 font-medium">
                                AI-powered external job suggestions tailored to your profile
                            </p>
                        </div>
                    </div>
                    {jobs.length > 0 && !loading && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchJobs}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    )}
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i} className="animate-pulse border-neutral-200 h-44 rounded-xl">
                                <CardContent className="p-8 flex gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
                                        <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                                        <div className="h-16 bg-neutral-50 rounded w-full"></div>
                                    </div>
                                    <div className="w-32 h-10 bg-neutral-200 rounded"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <Card className="border-red-200 bg-red-50 rounded-2xl overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900 mb-4">{error}</h3>
                            <Button variant="primary" size="lg" onClick={fetchJobs} className="rounded-xl px-12">
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                ) : jobs.length > 0 ? (
                    <div className="grid gap-6">
                        {jobs.map((job) => (
                            <Card
                                key={job.id}
                                className="group hover:border-cyan-200 transition-all duration-300 bg-white shadow-sm border-neutral-200 rounded-xl overflow-hidden"
                            >
                                <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-8">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <h3 className="text-2xl font-black text-neutral-900 group-hover:text-cyan-600 transition-colors tracking-tight">
                                                    {job.title}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        text-[10px] font-black uppercase tracking-widest px-2 py-1
                                                        ${job.source === 'Jooble' ? 'border-purple-200 bg-purple-50 text-purple-600' : 'border-blue-200 bg-blue-50 text-blue-600'}
                                                    `}
                                                >
                                                    {job.source}
                                                </Badge>
                                            </div>

                                            {/* Matched Skill Reason */}
                                            {job.matched_skill && (
                                                <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                                    <Zap className="w-3.5 h-3.5" />
                                                    Matched by: <span className="font-black">{job.matched_skill}</span>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-4">
                                                <div className="flex items-center gap-2 text-neutral-700 font-bold">
                                                    <Briefcase className="w-4 h-4 text-cyan-600" />
                                                    {job.company}
                                                </div>
                                                {job.location && (
                                                    <div className="flex items-center gap-2 text-neutral-600 font-bold">
                                                        <MapPin className="w-4 h-4 text-neutral-400" />
                                                        {job.location}
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-neutral-500 line-clamp-2 leading-relaxed text-base font-medium opacity-90">
                                                {job.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={() => handleApplyClick(job.apply_url)}
                                                className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 font-black uppercase tracking-widest px-8 rounded-lg"
                                            >
                                                Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <div className="py-8 text-center text-neutral-400 font-medium italic">
                            Showing top 30 recommendations based on your professional background.
                        </div>
                    </div>
                ) : (
                    <Card className="bg-neutral-50 border-dashed border-neutral-300 rounded-3xl">
                        <CardContent className="py-32 text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-neutral-100">
                                <Search className="w-12 h-12 text-neutral-300" />
                            </div>
                            <h3 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">No recommendations yet</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto mb-10 font-bold leading-relaxed">
                                We couldn't find any direct matches. Try updating your profile skills and job title preferences for better results.
                            </p>
                            <Button variant="outline" size="lg" onClick={fetchJobs} className="font-black px-12 h-14 rounded-xl">
                                Refresh Search
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RecommendedJobs;
