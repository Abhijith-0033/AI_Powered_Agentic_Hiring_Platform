import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

const AutoShortlist = () => {
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState(null);
    const [expandedCandidateId, setExpandedCandidateId] = useState(null); // For Explain Match
    const [currentJobDetails, setCurrentJobDetails] = useState(null);     // For Job Description view

    // Fetch jobs on mount
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await api.get('/ai-tools/jobs');
                if (response.data.success) {
                    setJobs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
                setMessage({ type: 'error', text: 'Failed to load jobs.' });
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchJobs();
    }, []);

    // Fetch candidates when job selection changes
    useEffect(() => {
        if (!selectedJob) {
            setCandidates([]);
            setCurrentJobDetails(null);
            return;
        }

        // Find details for selected job (from jobs array if sufficient, or fetch if needed). 
        // Our /jobs endpoint only returns basic info. We might need full description.
        // But POST /ai-tools/shortlist fetches it. Let's fetch it here for display if we want.
        // OR rely on what we have. Our /jobs endpoint (lines 18-32 in aiToolsRoutes) returns titles, location etc.
        // It DOES NOT return description.
        // We need to fetch job details solely for display.
        // Let's reuse the existing provider /jobs/:id endpoint or similar? 
        // The user says "Display the full job description... Content must be read-only".
        // Let's assume we can fetch it via /jobs/:id (from jobs.js route) if we have access.
        // Or we can just use the job_title for now if constraints are tight, BUT requirement says "Display job description".

        const fetchJobDetails = async () => {
            // We can reuse the public job endpoint or provider endpoint.
            // Assumption: api.get(`/jobs/${selectedJob}`) works for provider.
            try {
                const res = await api.get(`/jobs/${selectedJob}`);
                if (res.data.success) {
                    setCurrentJobDetails(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch job details for display", err);
            }
        };
        fetchJobDetails();

        const fetchCandidates = async () => {
            setLoadingCandidates(true);
            try {
                const response = await api.get(`/ai-tools/jobs/${selectedJob}/candidates`);
                if (response.data.success) {
                    setCandidates(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching candidates:', error);
                setMessage({ type: 'error', text: 'Failed to load candidates.' });
            } finally {
                setLoadingCandidates(false);
            }
        };

        fetchCandidates();
    }, [selectedJob]);

    // Handle Auto-Shortlist Execution
    const handleRunAutoShortlist = async () => {
        if (!selectedJob) return;
        setProcessing(true);
        setMessage(null);

        try {
            const response = await api.post(`/ai-tools/shortlist/${selectedJob}`);
            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                // Update candidate list with new results
                setCandidates(response.data.data);
            }
        } catch (error) {
            console.error('Error running auto-shortlist:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'AI processing failed.' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">AI Auto Shortlist</h1>
                <p className="mt-2 text-lg text-neutral-500">
                    Instantly rank candidates based on how well their resume matches your job description.
                </p>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Job Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Select a Job</CardTitle>
                    <CardDescription>Choose a job posting to analyze applicants for.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingJobs ? (
                        <div className="animate-pulse h-10 bg-gray-100 rounded w-full sm:w-1/2"></div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <select
                                value={selectedJob}
                                onChange={(e) => setSelectedJob(e.target.value)}
                                className="block w-full sm:w-1/2 rounded-lg border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                            >
                                <option value="">-- Select a Job --</option>
                                {jobs.map((job) => (
                                    <option key={job.job_id} value={job.job_id}>
                                        {job.job_title} ({job.applicant_count} applicants) - {job.location}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleRunAutoShortlist}
                                disabled={!selectedJob || candidates.length === 0 || processing}
                                className={`
                                    btn btn-primary
                                    ${(!selectedJob || candidates.length === 0 || processing) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing Profiles...
                                    </span>
                                ) : '✨ Run Auto Shortlist'}
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Job Description View (Read-Only) */}
            {currentJobDetails && (
                <Card>
                    <CardHeader>
                        <CardTitle>Job Context</CardTitle>
                        <CardDescription>AI uses this information to score candidates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        <div>
                            <h4 className="font-semibold text-sm text-neutral-900">Description</h4>
                            <p className="text-sm text-neutral-600 whitespace-pre-line">{currentJobDetails.job_description}</p>
                        </div>
                        {currentJobDetails.required_skills && (
                            <div>
                                <h4 className="font-semibold text-sm text-neutral-900">Required Skills</h4>
                                <p className="text-sm text-neutral-600">{currentJobDetails.required_skills}</p>
                            </div>
                        )}
                        {currentJobDetails.required_education && (
                            <div>
                                <h4 className="font-semibold text-sm text-neutral-900">Required Education</h4>
                                <p className="text-sm text-neutral-600">{currentJobDetails.required_education}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Candidates Results Section */}
            {selectedJob && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-neutral-900">
                            Candidates ({candidates.length})
                        </h2>
                        {candidates.length > 0 && !processing && (
                            <span className="text-sm text-neutral-500">
                                {candidates.some(c => c.match_score !== null)
                                    ? 'Sorted by Match Score (Highest First)'
                                    : 'Not yet analyzed'}
                            </span>
                        )}
                    </div>

                    {loadingCandidates ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse bg-white p-6 rounded-xl border border-neutral-200 h-24"></div>
                            ))}
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 border-dashed">
                            <p className="text-neutral-500">No applicants found for this job yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {candidates.map((candidate, index) => (
                                <Card key={candidate.application_id} flat className="border-neutral-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                                ${index < 3 && candidate.match_score !== null ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}
                                            `}>
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-neutral-900">{candidate.candidate_name}</h3>
                                                <p className="text-sm text-neutral-500">{candidate.candidate_email}</p>
                                                <span className={`text-xs mt-1 inline-flex items-center gap-1 ${candidate.has_resume ? 'text-neutral-500' : 'text-red-400'}`}>
                                                    {candidate.has_resume ? (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                            {candidate.resume_name || 'Resume Attached'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                            Resume Missing
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Match Score Badge */}
                                            {candidate.match_score !== null ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-right">
                                                        <div className={`
                                                            inline-flex items-center px-3 py-1 rounded-full text-sm font-bold
                                                            ${candidate.match_score >= 70 ? 'bg-green-100 text-green-700' :
                                                                candidate.match_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-50 text-red-600'}
                                                        `}>
                                                            {candidate.match_score}% Match
                                                        </div>
                                                        {candidate.shortlisted_by_ai && (
                                                            <div className="text-xs text-indigo-600 mt-1 font-medium">✨ AI Analyze</div>
                                                        )}
                                                    </div>

                                                    {candidate.explanation && (
                                                        <button
                                                            onClick={() => setExpandedCandidateId(expandedCandidateId === candidate.application_id ? null : candidate.application_id)}
                                                            className="text-xs text-primary-600 hover:text-primary-700 underline font-medium"
                                                        >
                                                            {expandedCandidateId === candidate.application_id ? 'Hide Explanation' : 'Explain Match'}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-neutral-400 bg-neutral-50 px-3 py-1 rounded-full">
                                                    Pending Analysis
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Explanation Panel */}
                                    {expandedCandidateId === candidate.application_id && candidate.explanation && (
                                        <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="font-semibold text-sm text-neutral-900 mb-3">Why {candidate.match_score}%?</h4>

                                            {/* Reasoning Summary */}
                                            <p className="text-sm text-neutral-700 whitespace-pre-line mb-4 bg-white p-3 rounded border border-neutral-100">
                                                {candidate.explanation.summary}
                                            </p>

                                            <div className="grid md:grid-cols-3 gap-4">
                                                {/* Matched Skills */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <span>✔</span> Skills Found
                                                    </h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {candidate.explanation.matchedSkills?.length > 0 ? (
                                                            candidate.explanation.matchedSkills.map((skill, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded border border-green-200 capitalize">
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-neutral-500">No specific skills detected.</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Missing Skills */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <span>✖</span> Skills Missing
                                                    </h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {candidate.explanation.missingSkills?.length > 0 ? (
                                                            candidate.explanation.missingSkills.map((skill, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded border border-red-100 capitalize">
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-neutral-500">All required skills matched!</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Education Match */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Education</h5>
                                                    <p className="text-sm text-neutral-700">{candidate.explanation.educationMatch || 'Not evaluated'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutoShortlist;
