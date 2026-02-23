
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, BarChart2, CheckCircle, AlertTriangle, Loader2, BookOpen, Rocket, ExternalLink, Info } from 'lucide-react';
import { Button } from '../ui';
import axios from '../../api/axios';

const MatchAnalysisModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingJobs, setFetchingJobs] = useState(false);
    const [result, setResult] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [jobSource, setJobSource] = useState('internal'); // 'internal' | 'external'
    const [searchFilters, setSearchFilters] = useState({ role: '', location: '' });
    const [selectedJobId, setSelectedJobId] = useState('');
    const [manualDescription, setManualDescription] = useState('');
    const [useProfileResume, setUseProfileResume] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (jobSource === 'internal') {
                fetchInternalJobs();
            }
        }
    }, [isOpen, jobSource]);

    const fetchInternalJobs = async () => {
        setFetchingJobs(true);
        try {
            const res = await axios.get('/jobs');
            if (res.data.success) {
                setJobs(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching internal jobs:', err);
        } finally {
            setFetchingJobs(false);
        }
    };

    const fetchExternalJobs = async () => {
        if (!searchFilters.role) {
            setError('Please enter a role to search for external jobs.');
            return;
        }
        setFetchingJobs(true);
        setError('');
        try {
            const res = await axios.get('/jobs/india', {
                params: {
                    role: searchFilters.role,
                    location: searchFilters.location
                }
            });
            if (res.data.success) {
                setJobs(res.data.data);
                if (res.data.data.length === 0) {
                    setError('No external jobs found for these criteria.');
                }
            }
        } catch (err) {
            console.error('Error fetching external jobs:', err);
            setError('Failed to fetch external jobs.');
        } finally {
            setFetchingJobs(false);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedJobId && !manualDescription) {
            setError('Please select a job or provide a description.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/ai/resume/analyze-match', {
                jobId: selectedJobId,
                jobDescription: manualDescription,
                useProfileResume
            });

            if (res.data.success) {
                setResult(res.data.data);
            } else {
                setError(res.data.error || 'Failed to analyze.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Server error during analysis.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center font-sans p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] relative text-neutral-900">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white sticky top-0 z-10 text-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">AI Match Analysis</h2>
                            <p className="text-sm text-neutral-500">Resume vs Job Fit Assessment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {!result ? (
                        <div className="space-y-6">
                            {/* Job Source Selection */}
                            <div className="flex p-1 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
                                <button
                                    onClick={() => { setJobSource('internal'); setSelectedJobId(''); setJobs([]); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${jobSource === 'internal' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                >
                                    Internal Jobs (Portal)
                                </button>
                                <button
                                    onClick={() => { setJobSource('external'); setSelectedJobId(''); setJobs([]); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${jobSource === 'external' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                >
                                    External Jobs (Adzuna/Jooble)
                                </button>
                            </div>

                            {jobSource === 'external' && (
                                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Job Role</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. React Developer"
                                                className="w-full p-2.5 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                                                value={searchFilters.role}
                                                onChange={(e) => setSearchFilters(prev => ({ ...prev, role: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Location</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Bangalore"
                                                className="w-full p-2.5 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                                                value={searchFilters.location}
                                                onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={fetchExternalJobs}
                                        disabled={fetchingJobs}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-xs font-bold"
                                    >
                                        {fetchingJobs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                                        Search External Postings
                                    </Button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    {jobSource === 'internal' ? 'Select Internal Job' : 'Select Search Success'}
                                </label>
                                <select
                                    value={selectedJobId}
                                    onChange={(e) => setSelectedJobId(e.target.value)}
                                    disabled={fetchingJobs}
                                    className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-neutral-700"
                                >
                                    <option value="">{fetchingJobs ? 'Fetching jobs...' : (jobSource === 'internal' ? 'Select an internal job...' : 'Select from search results...')}</option>
                                    {jobs.map(job => (
                                        <option key={job.job_id} value={job.job_id}>
                                            {job.job_title} - {job.external_company_name || job.company_name || 'Generic Company'} ({job.location})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-neutral-100" />
                                <span className="relative z-10 bg-white px-4 text-xs font-bold text-neutral-400 uppercase mx-auto block w-fit">OR</span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Paste Job Description</label>
                                <textarea
                                    value={manualDescription}
                                    onChange={(e) => setManualDescription(e.target.value)}
                                    placeholder="Paste the job description here if it's not listed above..."
                                    className="w-full p-4 rounded-xl border border-neutral-200 bg-neutral-50 focus:ring-2 focus:ring-emerald-500 min-h-[150px] transition-all text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                                <Info className="w-5 h-5 shrink-0" />
                                <p>Our Llama 3.3 AI will compare your profile resume against this job to identify matches, gaps, and bridge recommendations.</p>
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={loading || fetchingJobs}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 font-bold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <BarChart2 className="w-5 h-5 mr-2" />
                                        Run Match Analysis
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                            {/* Score Header */}
                            <div className="flex flex-col md:flex-row items-center gap-8 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="60" stroke="#eee" strokeWidth="8" fill="none" />
                                        <circle cx="64" cy="64" r="60" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray="377" strokeDashoffset={377 - (377 * result.match_percentage) / 100} className="transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-3xl font-bold text-neutral-900">{result.match_percentage}%</span>
                                        <span className="text-xs text-neutral-500 font-bold uppercase">Fit</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Analysis Result</h3>
                                    <p className="text-neutral-600 text-sm leading-relaxed">{result.overall_reasoning}</p>
                                </div>
                            </div>

                            {/* Skills Analysis */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                    <h4 className="flex items-center gap-2 mb-4 text-emerald-800 font-bold">
                                        <CheckCircle className="w-5 h-5" />
                                        Matching Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.skill_analysis.matching_skills.map(s => (
                                            <span key={s} className="px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-emerald-700 shadow-sm border border-emerald-100">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
                                    <h4 className="flex items-center gap-2 mb-4 text-amber-800 font-bold">
                                        <AlertTriangle className="w-5 h-5" />
                                        Missing Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.skill_analysis.missing_skills.map(s => (
                                            <span key={s} className="px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-amber-700 shadow-sm border border-amber-100">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Gap Bridging - Projects & Courses */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                        <Rocket className="w-5 h-5 text-blue-600" />
                                        Bridging the Gap
                                    </h4>
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">AI Recommendations</span>
                                </div>

                                <div className="space-y-4">
                                    {result.gap_bridging.map((bridge, idx) => (
                                        <div key={idx} className="border border-neutral-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                                                <span className="text-sm font-bold text-neutral-700">Missing Skill: <span className="text-blue-600">{bridge.missing_skill}</span></span>
                                            </div>
                                            <div className="p-5 grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase mb-3">
                                                        <Rocket className="w-3 h-3" /> Recommended Project
                                                    </div>
                                                    <h5 className="font-bold text-neutral-900 mb-1">{bridge.recommended_project.title}</h5>
                                                    <p className="text-sm text-neutral-600 mb-3">{bridge.recommended_project.description}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {bridge.recommended_project.tech_stack.map(t => (
                                                            <span key={t} className="px-2 py-0.5 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-500 uppercase">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase mb-3">
                                                        <BookOpen className="w-3 h-3" /> Learning Resources
                                                    </div>
                                                    {bridge.learning_resources.map((resource, rIdx) => (
                                                        <a
                                                            key={rIdx}
                                                            href="#"
                                                            className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                                            onClick={(e) => e.preventDefault()}
                                                        >
                                                            <div>
                                                                <p className="text-sm font-bold text-neutral-800 line-clamp-1">{resource.title}</p>
                                                                <p className="text-[10px] font-bold text-neutral-400 uppercase">{resource.platform} • {resource.type}</p>
                                                            </div>
                                                            <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-blue-500 transition-colors" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={() => setResult(null)} variant="outline" className="w-full py-3 border-neutral-200 font-bold">
                                Analyze Another Match
                            </Button>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-neutral-100 flex flex-col items-center animate-in zoom-in-95">
                            <div className="relative mb-6">
                                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                                <Target className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">AI Analyzing...</h3>
                            <p className="text-neutral-500 text-sm max-w-[200px] text-center">Comparing your experience with job requirements</p>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default MatchAnalysisModal;
