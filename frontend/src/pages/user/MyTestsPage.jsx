import { useState, useEffect } from 'react';
import { Clock, Calendar, Building2, FileText, CheckCircle, AlertCircle, Award, ChevronRight, Timer, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { getMyTests } from '../../services/testService';

const MyTestsPage = () => {
    const [data, setData] = useState({ upcoming: [], ongoing: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('ongoing');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyTests();
    }, []);

    const fetchMyTests = async () => {
        try {
            setLoading(true);
            const res = await getMyTests();
            setData(res.data || { upcoming: [], ongoing: [], completed: [] });
            // Auto-select first non-empty section
            if (res.data?.ongoing?.length > 0) setActiveSection('ongoing');
            else if (res.data?.upcoming?.length > 0) setActiveSection('upcoming');
            else setActiveSection('completed');
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date, time) => {
        if (!date) return 'N/A';
        try { return new Date(`${date}T${time || '00:00'}`).toLocaleString(); }
        catch { return `${date} ${time}`; }
    };

    const getTimeUntil = (date, time) => {
        if (!date) return '';
        const target = new Date(`${date}T${time || '00:00'}`);
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) return 'Starting now';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const sections = [
        { key: 'ongoing', label: 'Ongoing', count: data.ongoing.length, color: 'emerald' },
        { key: 'upcoming', label: 'Upcoming', count: data.upcoming.length, color: 'amber' },
        { key: 'completed', label: 'Completed', count: data.completed.length, color: 'blue' },
    ];

    const renderTestCard = (test, section) => {
        const scorePercentage = test.max_score > 0 ? Math.round((test.total_score / test.max_score) * 100) : null;

        return (
            <div key={`${test.id}-${section}`} className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{test.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-500">{test.company_name} — {test.job_title}</span>
                        </div>
                        {test.description && (
                            <p className="text-sm text-neutral-600 mb-3">{test.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {test.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDateTime(test.start_date, test.start_time)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Ends: {formatDateTime(test.end_date, test.end_time)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                        {section === 'ongoing' && (
                            <button
                                onClick={() => navigate(`/user/tests/${test.id}/attempt`)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                {test.attempt_id && test.attempt_status === 'in_progress' ? 'Resume Test' : 'Start Test'}
                            </button>
                        )}

                        {section === 'upcoming' && (
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-600">
                                    Starts in {getTimeUntil(test.start_date, test.start_time)}
                                </span>
                            </div>
                        )}

                        {section === 'completed' && (
                            <>
                                {test.expired && !test.attempt_id ? (
                                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Expired (Not Attempted)
                                    </span>
                                ) : (
                                    <>
                                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Submitted
                                        </span>
                                        {test.results_published ? (
                                            <button
                                                onClick={() => navigate(`/user/tests/${test.id}/results`)}
                                                className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors flex items-center gap-1"
                                            >
                                                <Award className="w-4 h-4" />
                                                View Results
                                            </button>
                                        ) : (
                                            <span className="text-xs text-neutral-400">Results not published yet</span>
                                        )}
                                        {scorePercentage !== null && test.results_published && (
                                            <span className="text-lg font-bold text-violet-700">{scorePercentage}%</span>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout type="user" title="My Tests">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900">My Tests</h2>
                    <p className="text-neutral-500 mt-1">View and take assigned assessments</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Section Tabs */}
                        <div className="flex gap-2 mb-6 bg-neutral-100 p-1 rounded-xl">
                            {sections.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveSection(s.key)}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeSection === s.key
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    {s.label}
                                    {s.count > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs bg-${s.color}-100 text-${s.color}-700`}>
                                            {s.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Test Cards */}
                        <div className="space-y-4">
                            {data[activeSection]?.length === 0 ? (
                                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                                    <FileText className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-neutral-700">
                                        {activeSection === 'ongoing' ? 'No ongoing tests' :
                                            activeSection === 'upcoming' ? 'No upcoming tests' : 'No completed tests'}
                                    </h3>
                                    <p className="text-neutral-500 mt-2">
                                        {activeSection === 'ongoing' ? 'Check back when a test window opens' :
                                            activeSection === 'upcoming' ? 'You will be notified when tests are assigned' :
                                                'Your completed tests will appear here'}
                                    </p>
                                </div>
                            ) : (
                                data[activeSection].map(test => renderTestCard(test, activeSection))
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyTestsPage;
