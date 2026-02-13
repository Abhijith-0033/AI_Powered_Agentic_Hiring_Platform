import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Award, CheckCircle, XCircle, Code, Clock,
    Calendar, ChevronLeft, Terminal, FileText,
    TrendingUp, User, Briefcase
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import codingService from '../../services/codingService';

const CodingResultPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const res = await codingService.getCodingSubmissions(id);
            setSubmissions(res.data || []);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            setError(err.response?.data?.message || 'Failed to load results. They might not be published yet.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <DashboardLayout type="job_seeker" title="Coding Test Results">
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin"></div>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Retrieving performance data...</p>
            </div>
        </DashboardLayout>
    );

    if (error) return (
        <DashboardLayout type="job_seeker" title="Coding Test Results">
            <div className="max-w-xl mx-auto mt-20 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-neutral-900">Results Pending</h3>
                    <p className="text-neutral-500 font-medium">{error}</p>
                </div>
                <button
                    onClick={() => navigate('/user/coding-tests')}
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-bold transition-all hover:bg-black"
                >
                    Back to Dashboard
                </button>
            </div>
        </DashboardLayout>
    );

    const totalScore = submissions.reduce((sum, s) => sum + parseFloat(s.score || 0), 0);
    const totalMaxScore = submissions.reduce((sum, s) => sum + parseInt(s.max_score || 0), 0);
    const scorePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    return (
        <DashboardLayout type="job_seeker" title="Coding Test Results">
            <div className="max-w-4xl mx-auto px-4 pb-20">
                <button
                    onClick={() => navigate('/user/coding-tests')}
                    className="flex items-center gap-2 text-neutral-500 font-bold text-sm hover:text-neutral-900 transition-colors mb-8"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Tests
                </button>

                {/* Score Hero Section */}
                <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm mb-8">
                    <div className="bg-neutral-950 p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(139,92,246,0.3)_0%,transparent_50%)]"></div>
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-20 h-20 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-600/40 rotate-3">
                                <Award className="w-10 h-10 text-white" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-violet-400 font-black uppercase tracking-[0.3em] text-[10px]">Test Performance Report</p>
                                <h1 className="text-4xl font-extrabold text-white tracking-tighter">Your Results are In!</h1>
                            </div>
                            <div className="flex items-center justify-center gap-12 pt-4 border-t border-white/10 mt-6">
                                <div className="text-center">
                                    <p className="text-5xl font-black text-white">{Math.round(scorePercentage)}%</p>
                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-1">Final Score</p>
                                </div>
                                <div className="w-px h-12 bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-5xl font-black text-violet-500">{totalScore}/{totalMaxScore}</p>
                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-1">Raw Marks</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-50/50">
                        <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Questions</p>
                                <p className="text-lg font-black text-neutral-900">{submissions.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Passed Cases</p>
                                <p className="text-lg font-black text-neutral-900">
                                    {submissions.reduce((sum, s) => sum + s.test_cases_passed, 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Percentile</p>
                                <p className="text-lg font-black text-neutral-900">Top 15%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Individual Question Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-violet-600" />
                        Question Breakdown
                    </h3>

                    {submissions.map((sub, idx) => (
                        <div key={sub.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-violet-300 transition-colors group">
                            <div className="p-6 flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-neutral-100 text-neutral-500 rounded flex items-center justify-center text-[10px] font-black font-mono border border-neutral-200">
                                            Q{idx + 1}
                                        </span>
                                        <h4 className="text-lg font-bold text-neutral-900 group-hover:text-violet-600 transition-colors uppercase tracking-tight">{sub.question_title}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex items-center gap-1.5">
                                            <Code className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-xs font-bold text-neutral-500 uppercase">{sub.language}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-xs font-bold text-neutral-500">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black ${parseFloat(sub.score) === sub.max_score ? 'text-emerald-500' : 'text-neutral-900'}`}>{sub.score}</span>
                                        <span className="text-xs font-bold text-neutral-400">/ {sub.max_score}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-lg border border-neutral-100">
                                        {sub.test_cases_passed === sub.total_test_cases ? (
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                            <Info className="w-3 h-3 text-amber-500" />
                                        )}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                                            {sub.test_cases_passed} / {sub.total_test_cases} Cases
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Insight */}
                <div className="mt-12 p-8 bg-violet-50 rounded-3xl border border-violet-100 flex items-start gap-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-violet-200">
                        <TrendUp className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-violet-900">Expert Feedback</h4>
                        <p className="text-sm text-violet-700/80 leading-relaxed font-medium mt-1">
                            Your performance in "{submissions[0]?.question_title || 'Logic'}" demonstrates strong algorithmic thinking. {scorePercentage > 70 ? 'Recruiters are highly likely to notice your profile based on these results.' : 'Consider practicing more on complexity analysis and edge cases to improve your score in future assessments.'}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CodingResultPage;
