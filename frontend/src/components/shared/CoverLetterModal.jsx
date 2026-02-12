
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Download, RefreshCw, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button, Badge } from '../ui'; // Adjust imports based on your UI library
import axios from 'axios';

const CoverLetterModal = ({ isOpen, onClose, candidateId }) => { // candidateId might come from context
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [tone, setTone] = useState('professional');
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [version, setVersion] = useState(1);
    const [copied, setCopied] = useState(false);

    // Fetch applied jobs or all jobs for selection
    useEffect(() => {
        if (isOpen) {
            fetchJobs();
        }
    }, [isOpen]);

    const fetchJobs = async () => {
        try {
            // In a real scenario, we might want jobs the user has applied to, or starred.
            // For now, let's fetch all active jobs for demonstration
            const res = await axios.get('http://localhost:3000/api/jobs'); // Adjust URL
            if (res.data.success) {
                setJobs(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch jobs', err);
            setError('Failed to load jobs. Please try again.');
        }
    };

    const handleGenerate = async () => {
        if (!selectedJob) return;
        setLoading(true);
        setError('');
        setGeneratedContent('');
        setPdfUrl('');
        setAnalysis(null);

        try {
            const token = localStorage.getItem('token'); // Simplistic auth
            const res = await axios.post('http://localhost:3000/api/ai/cover-letter/generate', {
                jobId: selectedJob,
                tone
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const data = res.data.data;
                setGeneratedContent(data.content);
                setPdfUrl(data.pdfUrl);
                setAnalysis(data.analysis);
                // setVersion(prev => prev + 1); // If we track versions locally
            }
        } catch (err) {
            console.error('Generation Error', err);
            setError(err.response?.data?.message || 'Failed to generate cover letter. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (pdfUrl) {
            // Construct full URL
            const url = `http://localhost:3000${pdfUrl}`;
            window.open(url, '_blank');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">AI Cover Letter Generator</h2>
                        <p className="text-sm text-neutral-500">Hybrid AI Agent • Enterprise Grade</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-neutral-500" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">

                {/* Left Panel: Controls */}
                <div className="w-full md:w-1/3 max-w-md p-6 border-r border-neutral-200 bg-neutral-50 overflow-y-auto h-full custom-scrollbar">
                    <div className="space-y-6">

                        {/* Job Selection */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Target Job</label>
                            <select
                                className="w-full p-2.5 rounded-lg border border-neutral-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                value={selectedJob}
                                onChange={(e) => setSelectedJob(e.target.value)}
                            >
                                <option value="">Select a job...</option>
                                {jobs.map(job => (
                                    <option key={job.job_id} value={job.job_id}>
                                        {job.job_title} - {job.company_name || job.external_company_name || 'Unknown Company'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tone Selection */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Tone</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['professional', 'enthusiastic', 'confident', 'formal'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTone(t)}
                                        className={`p-2 text-sm rounded-md border transition-all ${tone === t
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!selectedJob || loading}
                            className="w-full py-3 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            variant="primary" // Assuming you have variants
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Generate Draft
                                </>
                            )}
                        </Button>

                        {/* Analysis Panel (Post-Generation) */}
                        {analysis && (
                            <div className="space-y-3 pt-4 border-t border-neutral-200 animate-in slide-in-from-bottom duration-300">
                                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Analysis</h4>

                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-emerald-800">Match Score</span>
                                        <span className="text-xs font-bold text-emerald-700">{analysis.matchPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-emerald-200 rounded-full h-1.5">
                                        <div
                                            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                                            style={{ width: `${analysis.matchPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs">
                                        <span className="font-medium text-neutral-700">Matched: </span>
                                        <span className="text-neutral-500">{analysis.matchedSkills || 'None'}</span>
                                    </div>
                                    {analysis.missingSkills && (
                                        <div className="text-xs">
                                            <span className="font-medium text-amber-700">Missing: </span>
                                            <span className="text-amber-600">{analysis.missingSkills}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 animate-in fade-in">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Preview (Full Width & Height) */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b border-neutral-200 bg-white flex items-center justify-between shadow-sm z-10">
                        <h3 className="font-medium text-neutral-900">Live Preview</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                disabled={!generatedContent}
                                className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied' : 'Copy Text'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-neutral-50/30 overflow-hidden relative">
                        {generatedContent ? (
                            <textarea
                                className="w-full h-full p-8 resize-none border-none focus:ring-0 text-neutral-800 leading-relaxed font-serif text-lg bg-transparent focus:outline-none"
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                                spellCheck={false}
                                placeholder="Generated cover letter will appear here..."
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 space-y-4">
                                <div className="p-6 bg-neutral-100 rounded-full">
                                    <SparklesIcon className="w-12 h-12 text-neutral-300" />
                                </div>
                                <p className="text-lg font-medium text-neutral-500">Ready to Generate</p>
                                <p className="text-sm max-w-xs text-center">Select a job and tone to create a tailored cover letter in seconds.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer with Download Button */}
                    <div className="p-4 border-t border-neutral-200 bg-white flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                        <div className="flex items-center gap-4">
                            {pdfUrl && (
                                <span className="text-sm text-neutral-500">
                                    Ready for download
                                </span>
                            )}
                            <Button
                                onClick={handleDownload}
                                disabled={!pdfUrl}
                                className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all shadow-md disabled:opacity-50 disabled:shadow-none min-w-[200px] justify-center"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Simple Sparkles Icon component if lucide one isn't imported
const SparklesIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

export default CoverLetterModal;
