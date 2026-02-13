import React from 'react';
import Editor from "@monaco-editor/react";
import { X, Code, Award, Clock, CheckCircle, XCircle, Info, FileCode, AlertCircle } from 'lucide-react';

const SubmissionCodeModal = ({ open, onClose, submission }) => {
    if (!open || !submission) return null;

    const results = Array.isArray(submission.results) ? submission.results : [];
    const submittedAt = new Date(submission.submitted_at).toLocaleString();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#0f172a] border border-neutral-800 w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <FileCode className="text-purple-400 w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-none">
                                {submission.candidate_name || 'Candidate Submission'}
                            </h2>
                            <p className="text-xs text-neutral-400 mt-1">
                                {submission.question_title} • Submitted {submittedAt}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Bar */}
                <div className="flex items-center gap-6 px-6 py-3 bg-neutral-900/30 border-b border-neutral-800 text-sm overflow-x-auto">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Code size={14} className="text-neutral-500" />
                        <span className="text-neutral-400">Language:</span>
                        <span className="px-2 py-0.5 bg-neutral-800 rounded text-purple-400 font-mono text-xs uppercase">
                            {submission.language}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Award size={14} className="text-neutral-500" />
                        <span className="text-neutral-400">Score:</span>
                        <span className={`font-bold ${submission.score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {submission.score}%
                        </span>
                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <CheckCircle size={14} className="text-neutral-500" />
                        <span className="text-neutral-400">Test Cases:</span>
                        <span className="text-white font-medium">
                            {submission.test_cases_passed} / {submission.total_test_cases}
                        </span>
                    </div>

                    {submission.execution_time !== undefined && (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <Clock size={14} className="text-neutral-500" />
                            <span className="text-neutral-400">Time:</span>
                            <span className="text-white font-medium">
                                {submission.execution_time}ms
                            </span>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    {/* Left: Code Editor */}
                    <div className="flex-1 min-h-0 border-r border-neutral-800 relative">
                        <Editor
                            height="100%"
                            language={submission.language === 'python3' ? 'python' : submission.language}
                            value={submission.source_code}
                            theme="vs-dark"
                            loading={<div className="flex items-center justify-center h-full text-neutral-500 italic">Initializing editor...</div>}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20 },
                                lineNumbers: 'on',
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                            }}
                        />
                    </div>

                    {/* Right: Test Results Table */}
                    <div className="w-full md:w-80 bg-neutral-900/20 overflow-y-auto p-4 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                            <Info size={12} />
                            Test Case Breakdown
                        </h3>

                        {results.length > 0 ? (
                            <div className="space-y-3">
                                {results.map((res, idx) => (
                                    <div key={idx} className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 text-[11px]">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-neutral-500 font-mono">CASE #{res.testCaseIndex || idx + 1}</span>
                                            {res.passed ? (
                                                <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                                                    <CheckCircle size={10} /> PASSED
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                                                    <XCircle size={10} /> FAILED
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-neutral-600 mb-0.5 uppercase tracking-tighter font-bold">Input</p>
                                                <code className="block bg-neutral-900 p-1.5 rounded text-neutral-400 border border-neutral-800 whitespace-pre-wrap">{res.input || 'None'}</code>
                                            </div>
                                            <div>
                                                <p className="text-neutral-600 mb-0.5 uppercase tracking-tighter font-bold">Expected</p>
                                                <code className="block bg-neutral-900 p-1.5 rounded text-neutral-300 border border-neutral-800 whitespace-pre-wrap">{res.expectedOutput || res.expected || 'None'}</code>
                                            </div>
                                            <div>
                                                <p className="text-neutral-600 mb-0.5 uppercase tracking-tighter font-bold">Actual</p>
                                                <code className="block bg-neutral-900 p-1.5 rounded text-red-300 border border-neutral-800 whitespace-pre-wrap">{res.actualOutput || res.actual || '<Empty>'}</code>
                                            </div>
                                            {res.stderr && (
                                                <div className="mt-2">
                                                    <p className="text-red-500/70 mb-0.5 uppercase tracking-tighter font-bold">Error Output</p>
                                                    <code className="block bg-red-950/20 p-1.5 rounded text-red-400 border border-red-900/30 whitespace-pre-wrap">{res.stderr}</code>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-600">
                                <AlertCircle size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">No detailed test results available for this submission.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionCodeModal;
