import React from 'react';
import {
    BarChart3,
    CheckCircle,
    Clock,
    FileText,
    Shield,
    Target,
    Users,
    Zap
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * AI Tools page for recruiters
 * Auto-shortlist, rank candidates, generate JD
 */
const AITools = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const aiTools = [
        {
            id: 'auto-shortlist',
            icon: Users,
            title: 'Auto-Shortlist',
            description: 'Automatically shortlist candidates based on job requirements and AI analysis',
            status: 'ready',
            color: 'primary',
            stats: '45 candidates processed today',
        },
        {
            id: 'rank-candidates',
            icon: BarChart3,
            title: 'Rank Candidates',
            description: 'AI-powered ranking of applicants based on skills, experience, and culture fit',
            status: 'ready',
            color: 'secondary',
            stats: 'Average ranking accuracy: 94%',
        },
        {
            id: 'generate-jd',
            icon: FileText,
            title: 'Generate Job Description',
            description: 'Create optimized job descriptions using AI to attract the right candidates',
            status: 'ready',
            color: 'success',
            stats: '12 JDs generated this month',
        },
        {
            id: 'skill-match',
            icon: Target,
            title: 'Skill Matching',
            description: 'Deep analysis of candidate skills against job requirements',
            status: 'ready',
            color: 'warning',
            stats: '98% match precision',
        },
        {
            id: 'fraud-detection',
            icon: Shield,
            title: 'Resume Fraud Detection',
            description: 'Detect inconsistencies and potential fraud in candidate resumes',
            status: 'beta',
            color: 'error',
            stats: '3 alerts this week',
        },
        {
            id: 'interview-prep',
            icon: Zap,
            title: 'Interview Questions',
            description: 'Generate tailored interview questions based on job and candidate profile',
            status: 'beta',
            color: 'primary',
            stats: 'Coming soon',
        },
    ];


    const [jobs, setJobs] = React.useState([]);
    const [selectedJob, setSelectedJob] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState(null);

    React.useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/jobs`);
                const data = await response.json();
                if (data.success) {
                    setJobs(data.data.map(job => ({ value: job.job_id, label: job.job_title })));
                }
            } catch (error) {
                console.error('Failed to fetch jobs:', error);
            }
        };
        fetchJobs();
    }, []);

    const handleRunTool = async (toolId) => {
        if (toolId === 'auto-shortlist') {
            if (!selectedJob) return;
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/ai/auto-shortlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: selectedJob })
                });
                const data = await response.json();
                if (data.success) {
                    setResults(data.data);
                    // For now, show a simple alert or update UI state
                    console.log('Shortlist results:', data.data);
                    alert(`Check console for results! Found ${data.data.length} matches.`);
                }
            } catch (error) {
                console.error('Error running shortlist:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <DashboardLayout type="provider" title="AI Tools">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                        AI-Powered Hiring Tools
                    </h2>
                    <p className="text-neutral-500">
                        Leverage AI to streamline your hiring process and make better decisions.
                    </p>
                </div>

                {/* AI Tools Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {aiTools.map((tool, index) => {
                        const Icon = tool.icon;
                        const isAutoShortlist = tool.id === 'auto-shortlist';

                        return (
                            <Card
                                key={tool.id}
                                hover
                                className="group animate-fade-in shadow-sm hover:shadow-md transition-shadow"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <CardContent>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`
                      p-3 rounded-xl 
                      ${tool.color === 'primary' ? 'bg-primary-50' :
                                                tool.color === 'secondary' ? 'bg-indigo-50' :
                                                    tool.color === 'success' ? 'bg-emerald-50' :
                                                        tool.color === 'warning' ? 'bg-amber-50' :
                                                            'bg-rose-50'}
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                                            <Icon className={`
                        w-6 h-6
                        ${tool.color === 'primary' ? 'text-primary-600' :
                                                    tool.color === 'secondary' ? 'text-indigo-600' :
                                                        tool.color === 'success' ? 'text-emerald-600' :
                                                            tool.color === 'warning' ? 'text-amber-600' :
                                                                'text-rose-600'}
                      `} />
                                        </div>
                                        {tool.status === 'beta' && (
                                            <Badge variant="warning" size="sm">Beta</Badge>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-neutral-900 mb-2">{tool.title}</h3>
                                    <p className="text-sm text-neutral-500 mb-4">{tool.description}</p>

                                    {tool.stats && (
                                        <p className="text-xs text-neutral-400 mb-4">{tool.stats}</p>
                                    )}

                                    {isAutoShortlist && (
                                        <div className="mb-4">
                                            <select
                                                className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                value={selectedJob}
                                                onChange={(e) => setSelectedJob(e.target.value)}
                                            >
                                                <option value="">Select a Job to Shortlist</option>
                                                {jobs.map(job => (
                                                    <option key={job.value} value={job.value}>{job.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <Button
                                        size="sm"
                                        fullWidth
                                        onClick={() => handleRunTool(tool.id)}
                                        disabled={isAutoShortlist && !selectedJob || loading}
                                        variant="outline"
                                        className="hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                                    >
                                        {loading && isAutoShortlist ? 'Processing...' : 'Run Tool'}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Results Section (Temporary) */}
                {results && (
                    <Card className="mb-8 shadow-sm">
                        <CardHeader>
                            <CardTitle>Shortlist Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {results.map((result, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                        <div>
                                            <p className="font-bold text-neutral-900">{result.name}</p>
                                            <p className="text-sm text-neutral-500">{result.email}</p>
                                            <p className="text-xs text-neutral-400 mt-1">{result.analysis_data?.summary}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={result.score > 70 ? 'success' : 'warning'}>
                                                Match: {result.score}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}


            </div>
        </DashboardLayout>
    );
};

export default AITools;
