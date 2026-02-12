import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Send, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { getTestForAttempt, submitTest, saveTestProgress } from '../../services/testService';

const TestAttemptPage = () => {
    const { id: testId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [attemptId, setAttemptId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [violations, setViolations] = useState(0);
    const [warning, setWarning] = useState('');

    const timerRef = useRef(null);
    const saveIntervalRef = useRef(null);

    // Load test data
    useEffect(() => {
        const loadTest = async () => {
            try {
                setLoading(true);
                const res = await getTestForAttempt(testId);
                const data = res.data;
                setTest(data.test);
                setQuestions(data.questions);
                setAttemptId(data.attemptId);

                // Restore answers if resuming
                if (data.existingAnswers && data.existingAnswers.length > 0) {
                    const restored = {};
                    data.existingAnswers.forEach(a => { restored[a.question_id] = a.candidate_answer; });
                    setAnswers(restored);
                }

                // Calculate time remaining
                const startedAt = new Date(data.startedAt);
                const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
                const totalSeconds = data.test.duration_minutes * 60;
                const remaining = Math.max(0, totalSeconds - elapsed);
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    handleAutoSubmit(data.attemptId, {});
                }
            } catch (err) {
                console.error('Error loading test:', err);
                setError(err.response?.data?.message || 'Failed to load test');
            } finally {
                setLoading(false);
            }
        };
        loadTest();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        };
    }, [testId]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0 || submitted) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit(attemptId, answers);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timeLeft, submitted, attemptId]);

    // Auto-save progress every 30 seconds
    useEffect(() => {
        if (!attemptId || submitted) return;

        saveIntervalRef.current = setInterval(() => {
            saveProgress();
        }, 30000);

        return () => { if (saveIntervalRef.current) clearInterval(saveIntervalRef.current); };
    }, [attemptId, answers, submitted]);

    // Proctoring: detect tab switches
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && !submitted) {
                setViolations(prev => prev + 1);
                setWarning('⚠️ Tab switch detected! This will be reported to the recruiter.');
                setTimeout(() => setWarning(''), 5000);
            }
        };

        const handleBeforeUnload = (e) => {
            if (!submitted) {
                e.preventDefault();
                e.returnValue = 'You have an ongoing test. Are you sure you want to leave?';
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [submitted]);

    const saveProgress = async () => {
        if (!attemptId || submitted) return;
        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, candidateAnswer]) => ({
                questionId, candidateAnswer
            }));
            await saveTestProgress(testId, { attemptId, answers: formattedAnswers });
        } catch (err) {
            console.error('Auto-save error:', err);
        }
    };

    const handleAutoSubmit = useCallback(async (aId, currentAnswers) => {
        await doSubmit(aId || attemptId, currentAnswers || answers, true);
    }, [attemptId, answers]);

    const handleManualSubmit = async () => {
        setShowConfirm(false);
        await doSubmit(attemptId, answers, false);
    };

    const doSubmit = async (aId, currentAnswers, autoSubmitted) => {
        if (submitted || submitting) return;
        try {
            setSubmitting(true);
            const formattedAnswers = Object.entries(currentAnswers).map(([questionId, candidateAnswer]) => ({
                questionId, candidateAnswer
            }));
            const res = await submitTest(testId, { attemptId: aId, answers: formattedAnswers, autoSubmitted });
            setSubmitted(true);
            setSubmitResult(res.data);
            if (timerRef.current) clearInterval(timerRef.current);
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        } catch (err) {
            console.error('Submit failed:', err);
            alert('Failed to submit: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const setAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (timeLeft <= 60) return 'text-red-600 bg-red-50 border-red-200';
        if (timeLeft <= 300) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-neutral-700 bg-white border-neutral-200';
    };

    // ============ LOADING / ERROR ============
    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600 font-medium">Loading test...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Cannot Access Test</h2>
                    <p className="text-neutral-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/user/tests')}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                        Back to My Tests
                    </button>
                </div>
            </div>
        );
    }

    // ============ SUBMITTED ============
    if (submitted) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md text-center shadow-lg">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Test Submitted!</h2>
                    <p className="text-neutral-600 mb-6">Your answers have been recorded successfully.</p>
                    {submitResult && (
                        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-neutral-500 mb-1">Your Score</p>
                            <p className="text-3xl font-bold text-violet-700">
                                {submitResult.totalScore}/{submitResult.maxScore}
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">
                                {submitResult.scorePercentage}% • {Math.floor(submitResult.timeTakenSeconds / 60)}m {submitResult.timeTakenSeconds % 60}s
                            </p>
                        </div>
                    )}
                    <p className="text-xs text-neutral-400 mb-4">Detailed results will be available once the recruiter publishes them.</p>
                    <button
                        onClick={() => navigate('/user/tests')}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                        Back to My Tests
                    </button>
                </div>
            </div>
        );
    }

    // ============ TEST INTERFACE ============
    const currentQuestion = questions[currentQ];
    const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Warning Banner */}
            {warning && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-medium animate-pulse">
                    {warning}
                </div>
            )}

            {/* Top Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-neutral-900">{test?.title}</h1>
                        <p className="text-xs text-neutral-500">{answeredCount}/{questions.length} answered</p>
                    </div>

                    {/* Timer */}
                    <div className={`px-4 py-2 rounded-lg border font-mono text-lg font-bold flex items-center gap-2 ${getTimerColor()}`}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>

                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={submitting}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        Submit Test
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
                {/* Question Navigator (Sidebar) */}
                <div className="w-48 flex-shrink-0 hidden lg:block">
                    <div className="bg-white rounded-xl border border-neutral-200 p-4 sticky top-24">
                        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Questions</h3>
                        <div className="grid grid-cols-5 gap-1.5">
                            {questions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentQ(i)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${i === currentQ
                                            ? 'bg-violet-600 text-white'
                                            : answers[q.id]?.trim()
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 space-y-1 text-xs text-neutral-500">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
                                Answered
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-neutral-100 border border-neutral-200"></div>
                                Unanswered
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-violet-600"></div>
                                Current
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1">
                    {currentQuestion && (
                        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                                    {currentQ + 1}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${currentQuestion.question_type === 'objective'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {currentQuestion.question_type === 'objective' ? 'Multiple Choice' : 'Descriptive'}
                                </span>
                            </div>

                            <h2 className="text-lg font-medium text-neutral-900 mb-6">
                                {currentQuestion.question_text}
                            </h2>

                            {/* MCQ Options */}
                            {currentQuestion.question_type === 'objective' && currentQuestion.options && (
                                <div className="space-y-3">
                                    {(typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options).map((option, oIdx) => (
                                        <label
                                            key={oIdx}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestion.id] === option
                                                    ? 'border-violet-500 bg-violet-50'
                                                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[currentQuestion.id] === option
                                                    ? 'border-violet-500 bg-violet-500'
                                                    : 'border-neutral-300'
                                                }`}>
                                                {answers[currentQuestion.id] === option && (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                )}
                                            </div>
                                            <input
                                                type="radio"
                                                name={`q-${currentQuestion.id}`}
                                                value={option}
                                                checked={answers[currentQuestion.id] === option}
                                                onChange={() => setAnswer(currentQuestion.id, option)}
                                                className="sr-only"
                                            />
                                            <span className="text-neutral-800">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Descriptive Answer */}
                            {currentQuestion.question_type === 'descriptive' && (
                                <textarea
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none bg-neutral-50"
                                    rows={6}
                                />
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-5 border-t border-neutral-100">
                                <button
                                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                    disabled={currentQ === 0}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <span className="text-sm text-neutral-500">
                                    {currentQ + 1} of {questions.length}
                                </span>
                                <button
                                    onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                                    disabled={currentQ === questions.length - 1}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-30"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-900 text-center mb-2">Submit Test?</h3>
                        <p className="text-neutral-600 text-center text-sm mb-2">
                            You have answered {answeredCount} out of {questions.length} questions.
                        </p>
                        {answeredCount < questions.length && (
                            <p className="text-amber-600 text-center text-sm mb-4 font-medium">
                                {questions.length - answeredCount} question(s) are unanswered!
                            </p>
                        )}
                        <p className="text-neutral-500 text-center text-xs mb-6">
                            This action cannot be undone. You will not be able to reattempt.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualSubmit}
                                disabled={submitting}
                                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestAttemptPage;
