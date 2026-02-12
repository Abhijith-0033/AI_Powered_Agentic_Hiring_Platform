import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, XCircle, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { getMyTestResult } from '../../services/testService';

const TestResultPage = () => {
    const { id: testId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                setLoading(true);
                const res = await getMyTestResult(testId);
                setResult(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load results');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [testId]);

    if (loading) {
        return (
            <DashboardLayout type="user" title="Test Results">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout type="user" title="Test Results">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error</h2>
                    <p className="text-neutral-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/user/tests')} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium">
                        Back to My Tests
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    if (!result?.resultsPublished) {
        return (
            <DashboardLayout type="user" title="Test Results">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">{result?.title}</h2>
                    <p className="text-neutral-600 mb-6">{result?.message || 'Results have not been published yet.'}</p>
                    <button onClick={() => navigate('/user/tests')} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium">
                        Back to My Tests
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="user" title="Test Results">
            <div className="max-w-3xl mx-auto">
                {/* Back button & header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate('/user/tests')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
                    </button>
                    <h2 className="text-2xl font-bold text-neutral-900">{result.title} — Results</h2>
                </div>

                {/* Score Summary Card */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.scorePercentage >= 60 ? 'bg-emerald-100' : 'bg-red-100'
                                }`}>
                                <Award className={`w-8 h-8 ${result.scorePercentage >= 60 ? 'text-emerald-600' : 'text-red-600'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Your Score</p>
                                <p className="text-3xl font-bold text-neutral-900">
                                    {result.totalScore}/{result.maxScore}
                                </p>
                                <p className={`text-sm font-medium ${result.scorePercentage >= 60 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {result.scorePercentage}%
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-sm text-neutral-500">
                            <p>Time: {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</p>
                            <p>Submitted: {new Date(result.submittedAt).toLocaleString()}</p>
                            {result.autoSubmitted && <p className="text-amber-600 font-medium">Auto-submitted</p>}
                        </div>
                    </div>
                </div>

                {/* Answers Breakdown */}
                <div className="space-y-4">
                    {result.answers.map((ans, idx) => (
                        <div key={idx} className={`bg-white rounded-xl border-2 p-5 ${ans.is_correct ? 'border-emerald-200' : 'border-red-200'
                            }`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-sm font-bold">
                                        {ans.question_order}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ans.question_type === 'objective' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                        {ans.question_type === 'objective' ? 'MCQ' : 'Descriptive'}
                                    </span>
                                </div>
                                {ans.is_correct ? (
                                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" /> Correct
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                                        <XCircle className="w-4 h-4" /> Incorrect
                                    </span>
                                )}
                            </div>

                            <p className="text-neutral-900 font-medium mb-4">{ans.question_text}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg ${ans.is_correct ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                    <p className="text-xs text-neutral-500 mb-1 font-medium">Your Answer</p>
                                    <p className={`text-sm font-medium ${ans.is_correct ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {ans.candidate_answer || '— No Answer —'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-50">
                                    <p className="text-xs text-neutral-500 mb-1 font-medium">Expected Answer</p>
                                    <p className="text-sm font-medium text-emerald-700">
                                        {ans.expected_answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Back button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/user/tests')}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                        Back to My Tests
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TestResultPage;
