import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Clock, Calendar, ChevronRight, FileCode, Search, Award, AlertCircle, Info } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import codingService from '../../services/codingService';

const CandidateCodingDashboard = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMyTests();
    }, []);

    const fetchMyTests = async () => {
        try {
            setLoading(true);
            const res = await codingService.getMyCodingTests();
            setTests(res.data || []);
        } catch (error) {
            console.error('Error fetching candidate coding tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTests = tests.filter(test =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const ongoingTests = filteredTests.filter(t => t.submission_count === '0' || t.submission_count === 0);
    const completedTests = filteredTests.filter(t => parseInt(t.submission_count) > 0);

    const renderTestCard = (test) => {
        const isCompleted = parseInt(test.submission_count) > 0;

        return (
            <div key={test.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all group">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-violet-50 rounded-xl group-hover:bg-violet-600 transition-colors">
                            <Code className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                        </div>
                        {isCompleted ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" />
                                Completed
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                Pending
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 mb-1 group-hover:text-violet-600 transition-colors">{test.title}</h3>
                    <p className="text-sm text-neutral-500 font-medium mb-4">{test.job_title} at {test.company_name}</p>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 mb-6">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {test.time_limit} mins
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Award className="w-3.5 h-3.5 text-neutral-400" />
                            {test.total_marks} Marks
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                        {isCompleted ? (
                            test.results_published ? (
                                <button
                                    onClick={() => navigate(`/user/coding-tests/${test.id}/results`)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
                                >
                                    View Score
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="w-full py-2.5 bg-neutral-50 text-neutral-400 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Awaiting Results
                                </div>
                            )
                        ) : (
                            <button
                                onClick={() => navigate(`/user/coding-tests/${test.id}/attempt`)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all hover:-translate-y-0.5"
                            >
                                Start Coding Test
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout type="job_seeker" title="My Coding Tests">
            <div className="max-w-6xl mx-auto px-4 pb-20">
                <div className="mb-10 text-center space-y-2">
                    <h2 className="text-3xl font-extrabold text-neutral-900">Your Assessments</h2>
                    <p className="text-neutral-500 font-medium">Showcase your skills through algorithmic challenges</p>
                </div>

                <div className="relative mb-12 max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search tests or jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-neutral-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-violet-100 rounded-full animate-spin"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-600 rounded-full animate-spin [animation-duration:1.5s] border-t-transparent border-l-transparent"></div>
                        </div>
                        <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing tests...</p>
                    </div>
                ) : tests.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center shadow-sm">
                        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileCode className="w-10 h-10 text-neutral-200" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-800">No coding tests assigned</h3>
                        <p className="text-neutral-500 mt-2 max-w-sm mx-auto font-medium">When a recruiter invites you for a coding challenge for a job you applied to, it will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {ongoingTests.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                    <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Active Challenges</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ongoingTests.map(renderTestCard)}
                                </div>
                            </section>
                        )}

                        {completedTests.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Completed Sessions</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {completedTests.map(renderTestCard)}
                                </div>
                            </section>
                        )}

                        {filteredTests.length === 0 && (
                            <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
                                <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                                <p className="text-neutral-500 font-bold uppercase tracking-wider text-xs">No matching tests found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CandidateCodingDashboard;
