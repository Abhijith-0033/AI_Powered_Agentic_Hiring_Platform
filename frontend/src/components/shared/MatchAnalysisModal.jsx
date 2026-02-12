
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, BarChart2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui';

const MatchAnalysisModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = () => {
        setLoading(true);
        // Simulate
        setTimeout(() => {
            setLoading(false);
            setResult({
                score: 87,
                strong: ['React', 'Node.js', 'System Design'],
                missing: ['GraphQL', 'AWS'],
                culture: 'High Match'
            });
        }, 1500);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center font-sans">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Match Analysis</h2>
                            <p className="text-sm text-neutral-500">Detailed Job Fit Assessment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {!result ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Select a Job to Analyze</label>
                                <select className="w-full p-3 rounded-lg border border-neutral-300 bg-neutral-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                                    <option>Select a recent job...</option>
                                    <option>Senior Frontend Engineer - Google</option>
                                    <option>Product Designer - Stripe</option>
                                    <option>Backend Developer - Netflix</option>
                                </select>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-700">
                                This analysis uses our hybrid AI engine to compare your skills, experience, and cultural fit markers against the job description.
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                            >
                                <BarChart2 className="w-5 h-5 mr-2" />
                                Run Analysis
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center py-6">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="60" stroke="#eee" strokeWidth="8" fill="none" />
                                        <circle cx="64" cy="64" r="60" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray="377" strokeDashoffset={377 - (377 * result.score) / 100} className="transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-3xl font-bold text-neutral-900">{result.score}%</span>
                                        <span className="text-xs text-neutral-500 font-medium uppercase">Match</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                    <div className="flex items-center gap-2 mb-3 text-green-800 font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        Strong Matches
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.strong.map(s => (
                                            <span key={s} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-green-700 shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                    <div className="flex items-center gap-2 mb-3 text-amber-800 font-semibold">
                                        <AlertTriangle className="w-4 h-4" />
                                        Missing Skills
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missing.map(s => (
                                            <span key={s} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-amber-700 shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => setResult(null)} variant="outline" className="w-full">
                                Analyze Another Job
                            </Button>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                            <p className="text-lg font-medium text-emerald-900">Calculating fit score...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default MatchAnalysisModal;
