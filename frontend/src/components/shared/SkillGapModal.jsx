
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, BookOpen, ExternalLink, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '../ui';

const SkillGapModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setResult({
                gaps: [
                    { skill: 'GraphQL', priority: 'High', resources: ['Apollo Odyssey', 'GraphQL.org'] },
                    { skill: 'Docker', priority: 'Medium', resources: ['Docker Captains'] }
                ],
                marketDemand: 'High'
            });
        }, 1500);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center font-sans">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Zap className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Skill Gap Analysis</h2>
                            <p className="text-sm text-neutral-500">Market Competitiveness Report • Beta</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {!result ? (
                        <div className="space-y-6">
                            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex items-start gap-4">
                                <TrendingUp className="w-6 h-6 text-amber-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-amber-900 mb-1">Target Role Market Analysis</h3>
                                    <p className="text-amber-800 text-sm">
                                        We analyze thousands of active job postings for your target role to identify critical skills you might be missing.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Target Role</label>
                                <input
                                    type="text"
                                    defaultValue="Senior Software Engineer"
                                    className="w-full p-3 rounded-lg border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                Identify Gaps
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4">Recommended Actions</h3>

                            <div className="space-y-4">
                                {result.gaps.map((gap, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-neutral-200 bg-white hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center font-bold text-neutral-700">
                                                    {gap.skill.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-neutral-900">{gap.skill}</h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gap.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {gap.priority} Priority
                                                    </span>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">Ignore</Button>
                                        </div>

                                        <div className="bg-neutral-50 rounded-lg p-3">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" /> Learning Resources
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {gap.resources.map(r => (
                                                    <a key={r} href="#" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                                                        {r} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button onClick={() => setResult(null)} variant="ghost" className="w-full">
                                Back to Analysis
                            </Button>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                            <p className="text-lg font-medium text-amber-900">Scanning market data...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default SkillGapModal;
