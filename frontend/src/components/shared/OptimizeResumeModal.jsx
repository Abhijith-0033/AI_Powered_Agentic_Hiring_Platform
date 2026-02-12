
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Sparkles, Check, FileText, Loader2, RefreshCw, Download, AlertCircle, User, PenTool, File } from 'lucide-react';
import { Button } from '../ui';
import axios from 'axios';

const OptimizeResumeModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Input, 2: Result
    const [resumeSource, setResumeSource] = useState('profile'); // 'profile', 'upload', 'text'
    const [resumeText, setResumeText] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [result, setResult] = useState(null);
    const [mode, setMode] = useState('general'); // 'general' or 'targeted'
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [error, setError] = useState(null);

    // Fetch jobs when mode changes to targeted
    React.useEffect(() => {
        if (mode === 'targeted' && jobs.length === 0) {
            fetchJobs();
        }
    }, [mode]);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/jobs?status=Open', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setJobs(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setResumeFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleOptimize = async () => {
        // Validation
        if (resumeSource === 'text' && (!resumeText || resumeText.length < 50)) {
            setError('Please enter a valid resume text (at least 50 characters).');
            return;
        }
        if (resumeSource === 'upload' && !resumeFile) {
            setError('Please upload a PDF or DOCX resume.');
            return;
        }
        if (mode === 'targeted' && !selectedJobId) {
            setError('Please select a target job for optimization.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Add Resume Source
            if (resumeSource === 'upload') {
                formData.append('resumeFile', resumeFile);
            } else if (resumeSource === 'profile') {
                formData.append('useProfileResume', 'true');
            } else {
                formData.append('resumeText', resumeText);
            }

            // Add Job Context
            if (mode === 'targeted' && selectedJobId) {
                formData.append('jobId', selectedJobId);
            }

            const response = await axios.post('http://localhost:3000/api/ai/resume/optimize', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setResult(response.data.data);
                setStep(2);
            }
        } catch (err) {
            console.error('Optimization Failed:', err);
            setError(err.response?.data?.error || 'Failed to optimize resume. Please text input or try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center font-sans">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">AI Resume Optimizer</h2>
                            <p className="text-sm text-neutral-500">Hybrid Agentic Analysis • Determinist Scoring</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex">
                    {step === 1 && (
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="max-w-2xl mx-auto space-y-8">

                                {/* Optimization Mode */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-neutral-700">Optimization Goal</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setMode('general')}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'general' ? 'border-purple-600 bg-purple-50' : 'border-neutral-200 hover:border-purple-300'}`}
                                        >
                                            <div className="font-semibold text-neutral-900 mb-1">General Professional</div>
                                            <div className="text-xs text-neutral-500">Polish grammar, impact, and standadize format.</div>
                                        </button>
                                        <button
                                            onClick={() => setMode('targeted')}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'targeted' ? 'border-purple-600 bg-purple-50' : 'border-neutral-200 hover:border-purple-300'}`}
                                        >
                                            <div className="font-semibold text-neutral-900 mb-1">Targeted Role</div>
                                            <div className="text-xs text-neutral-500">Tailor for a specific job match.</div>
                                        </button>
                                    </div>

                                    {mode === 'targeted' && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Select Target Job</label>
                                            <select
                                                value={selectedJobId}
                                                onChange={(e) => setSelectedJobId(e.target.value)}
                                                className="w-full p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                            >
                                                <option value="">-- Select a Job from Database --</option>
                                                {jobs.map(job => (
                                                    <option key={job.job_id} value={job.job_id}>
                                                        {job.job_title} - {job.company_name || 'My Company'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-neutral-200 my-6"></div>

                                {/* Resume Source Tabs */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-neutral-700">Source Resume</label>
                                    <div className="flex p-1 bg-neutral-100 rounded-lg">
                                        <button
                                            onClick={() => setResumeSource('profile')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${resumeSource === 'profile' ? 'bg-white shadow text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            <User className="w-4 h-4" /> Use Existing Profile
                                        </button>
                                        <button
                                            onClick={() => setResumeSource('upload')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${resumeSource === 'upload' ? 'bg-white shadow text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            <Upload className="w-4 h-4" /> Upload File
                                        </button>
                                        <button
                                            onClick={() => setResumeSource('text')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${resumeSource === 'text' ? 'bg-white shadow text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            <PenTool className="w-4 h-4" /> Paste Text
                                        </button>
                                    </div>

                                    <div className="mt-4 min-h-[150px]">
                                        {resumeSource === 'profile' && (
                                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-600">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-purple-900">Current Profile Resume</h4>
                                                    <p className="text-sm text-purple-700 mt-1">We'll use the resume currently linked to your candidate profile.</p>
                                                </div>
                                            </div>
                                        )}

                                        {resumeSource === 'upload' && (
                                            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.docx"
                                                    onChange={handleFileChange}
                                                    id="resume-upload"
                                                    className="hidden"
                                                />
                                                <label htmlFor="resume-upload" className="cursor-pointer block">
                                                    <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                                                    <p className="text-sm font-medium text-neutral-900">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-neutral-500 mt-1">PDF or DOCX (Max 5MB)</p>
                                                    {resumeFile && (
                                                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                            <File className="w-4 h-4" /> {resumeFile.name}
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        )}

                                        {resumeSource === 'text' && (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={resumeText}
                                                    onChange={(e) => setResumeText(e.target.value)}
                                                    placeholder="Paste your resume text here..."
                                                    className="w-full h-48 p-4 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                                                />
                                                <p className="text-xs text-neutral-400 text-right">{resumeText.length}/12000 chars</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start border border-blue-100">
                                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> To ensure ATS compatibility, the optimized resume will be generated in a standard, high-performance professional PDF format. Original design elements may be standardized.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    onClick={handleOptimize}
                                    disabled={loading}
                                    className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 text-lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Reading & Optimizing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-3" />
                                            Optimize Resume
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && result && (
                        <div className="flex-1 flex flex-col h-full bg-neutral-50">
                            {/* Metrics Bar */}
                            <div className="bg-white border-b border-neutral-200 p-6 grid grid-cols-4 gap-6 shadow-sm z-10">
                                <div>
                                    <div className="text-sm text-neutral-500 font-medium mb-1">Original Score</div>
                                    <div className="text-2xl font-bold text-neutral-400">{result.originalScore}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-neutral-500 font-medium mb-1">Optimized Score</div>
                                    <div className="text-3xl font-bold text-purple-600">{result.optimizedScore}</div>
                                </div>
                                <div className="col-span-2 flex items-center justify-end">
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                                        +{result.improvement} Points Improved
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                {/* Sidebar: Suggestions */}
                                <div className="w-1/3 bg-white border-r border-neutral-200 p-6 overflow-y-auto">
                                    <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                        <Check className="w-5 h-5 text-green-600" /> Added Keywords
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {result.suggestions?.addedKeywords?.map((kw, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                                                +{kw}
                                            </span>
                                        ))}
                                        {(!result.suggestions?.addedKeywords || result.suggestions.addedKeywords.length === 0) && (
                                            <span className="text-sm text-neutral-400 italic">No specific missing keywords found.</span>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-amber-500" /> Still Missing
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {result.suggestions?.missingKeywords?.map((kw, i) => (
                                            <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
                                                -{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview Area */}
                                <div className="flex-1 p-8 overflow-y-auto bg-neutral-100">
                                    <div className="bg-white shadow-lg rounded-none min-h-[800px] w-full max-w-[800px] mx-auto p-12 text-neutral-900 border border-neutral-200 whitespace-pre-wrap font-serif">
                                        {result.content}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 bg-white border-t border-neutral-200 flex justify-between items-center z-10 shrink-0">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    Back to Editor
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={handleOptimize}>
                                        <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                                    </Button>
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => window.open(`http://localhost:3000${result.pdfUrl}`, '_blank')}>
                                        <Download className="w-4 h-4 mr-2" /> Download PDF
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OptimizeResumeModal;
