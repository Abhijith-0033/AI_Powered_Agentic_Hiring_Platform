import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ClipboardCheck, Eye, Send, CheckCircle, X, GripVertical, FileText, Clock, Calendar, Users, Award, ChevronRight, Edit3 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { createTest, getRecruiterTests, publishTest, deleteTest, updateTest, getTestById, getTestResults, publishTestResults } from '../../services/testService';
import axios from '../../api/axios';

const TestsPage = () => {
    const [activeTab, setActiveTab] = useState('list'); // list | create | edit | results
    const [editingTestId, setEditingTestId] = useState(null);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Create test state
    const [selectedJobId, setSelectedJobId] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [testForm, setTestForm] = useState({
        title: '',
        description: '',
        instructions: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        durationMinutes: 60
    });
    const [questions, setQuestions] = useState([
        { questionText: '', questionType: 'objective', options: ['', '', '', ''], expectedAnswer: '' }
    ]);
    const [saving, setSaving] = useState(false);

    // Results state
    const [selectedTest, setSelectedTest] = useState(null);
    const [results, setResults] = useState(null);
    const [loadingResults, setLoadingResults] = useState(false);
    const [expandedResult, setExpandedResult] = useState(null);

    // Fetch recruiter's tests
    useEffect(() => {
        fetchTests();
        fetchJobs();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const res = await getRecruiterTests();
            setTests(res.data || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            setLoadingJobs(true);
            const res = await axios.get('/jobs/recruiter');
            setJobs(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoadingJobs(false);
        }
    };

    // Fetch candidates when job changes
    useEffect(() => {
        if (!selectedJobId) { setCandidates([]); return; }
        const fetchCandidates = async () => {
            try {
                setLoadingCandidates(true);
                const res = await axios.get(`/recruiter/jobs/${selectedJobId}/applications`);
                setCandidates(res.data?.data || []);
            } catch (error) {
                console.error('Error fetching candidates:', error);
            } finally {
                setLoadingCandidates(false);
            }
        };
        fetchCandidates();
    }, [selectedJobId]);

    // Question management
    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', questionType: 'objective', options: ['', '', '', ''], expectedAnswer: '' }]);
    };

    const removeQuestion = (index) => {
        if (questions.length <= 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'questionType' && value === 'descriptive') {
            updated[index].options = [];
        } else if (field === 'questionType' && value === 'objective') {
            updated[index].options = ['', '', '', ''];
        }
        setQuestions(updated);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const updated = [...questions];
        updated[qIndex].options[oIndex] = value;
        setQuestions(updated);
    };

    // Create test
    const handleCreateTest = async (e) => {
        e.preventDefault();
        if (!selectedJobId) { alert('Please select a job'); return; }
        if (questions.some(q => !q.questionText.trim())) { alert('All questions must have text'); return; }
        if (questions.some(q => !q.expectedAnswer.trim())) { alert('All questions must have an expected answer'); return; }
        if (questions.some(q => q.questionType === 'objective' && q.options.some(o => !o.trim()))) {
            alert('All MCQ options must be filled'); return;
        }

        try {
            setSaving(true);
            await createTest({
                jobId: selectedJobId,
                ...testForm,
                questions
            });
            alert('Test created successfully!');
            setActiveTab('list');
            fetchTests();
            resetForm();
        } catch (error) {
            console.error('Error creating test:', error);
            alert('Failed to create test: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedJobId('');
        setEditingTestId(null);
        setTestForm({ title: '', description: '', instructions: '', startDate: '', startTime: '', endDate: '', endTime: '', durationMinutes: 60 });
        setQuestions([{ questionText: '', questionType: 'objective', options: ['', '', '', ''], expectedAnswer: '' }]);
    };

    // Edit test — load existing data into form
    const handleEditTest = async (test) => {
        try {
            const res = await getTestById(test.id);
            const data = res.data;
            setEditingTestId(data.id);
            setSelectedJobId(data.job_id);
            setTestForm({
                title: data.title || '',
                description: data.description || '',
                instructions: data.instructions || '',
                startDate: data.start_date || '',
                startTime: data.start_time || '',
                endDate: data.end_date || '',
                endTime: data.end_time || '',
                durationMinutes: data.duration_minutes || 60,
            });
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions.map(q => ({
                    questionText: q.question_text || '',
                    questionType: q.question_type || 'objective',
                    options: q.question_type === 'objective'
                        ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options || ['', '', '', ''])
                        : [],
                    expectedAnswer: q.expected_answer || '',
                })));
            }
            setActiveTab('edit');
        } catch (error) {
            alert('Failed to load test for editing: ' + (error.response?.data?.message || error.message));
        }
    };

    // Update existing test
    const handleUpdateTest = async (e) => {
        e.preventDefault();
        if (questions.some(q => !q.questionText.trim())) { alert('All questions must have text'); return; }
        if (questions.some(q => !q.expectedAnswer.trim())) { alert('All questions must have an expected answer'); return; }
        if (questions.some(q => q.questionType === 'objective' && q.options.some(o => !o.trim()))) {
            alert('All MCQ options must be filled'); return;
        }
        try {
            setSaving(true);
            await updateTest(editingTestId, { ...testForm, questions });
            alert('Test updated successfully!');
            setActiveTab('list');
            fetchTests();
            resetForm();
        } catch (error) {
            console.error('Error updating test:', error);
            alert('Failed to update test: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Check if test is editable (draft or published but not started yet)
    const isTestEditable = (test) => {
        if (test.status === 'draft') return true;
        if (test.status === 'published' && test.start_date && test.start_time) {
            const startDateTime = new Date(`${test.start_date}T${test.start_time}`);
            return new Date() < startDateTime;
        }
        return false;
    };

    // Publish test
    const handlePublish = async (testId) => {
        if (!confirm('Publish this test? It will be visible to all candidates who applied for this job.')) return;
        try {
            const res = await publishTest(testId);
            alert(res.message);
            fetchTests();
        } catch (error) {
            alert('Failed to publish: ' + (error.response?.data?.message || error.message));
        }
    };

    // Delete test
    const handleDelete = async (testId) => {
        if (!confirm('Are you sure you want to delete this test? This cannot be undone.')) return;
        try {
            await deleteTest(testId);
            fetchTests();
        } catch (error) {
            alert('Failed to delete: ' + (error.response?.data?.message || error.message));
        }
    };

    // View results
    const handleViewResults = async (test) => {
        try {
            setLoadingResults(true);
            setSelectedTest(test);
            setActiveTab('results');
            const res = await getTestResults(test.id);
            setResults(res.data);
        } catch (error) {
            console.error('Error fetching results:', error);
            alert('Failed to fetch results');
        } finally {
            setLoadingResults(false);
        }
    };

    // Publish results
    const handlePublishResults = async (testId) => {
        if (!confirm('Publish results? Candidates will be able to see their scores.')) return;
        try {
            await publishTestResults(testId);
            alert('Results published to candidates!');
            if (selectedTest) {
                const res = await getTestResults(testId);
                setResults(res.data);
            }
            fetchTests();
        } catch (error) {
            alert('Failed to publish results: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatDateTime = (date, time) => {
        if (!date) return 'N/A';
        try {
            return new Date(`${date}T${time || '00:00'}`).toLocaleString();
        } catch { return `${date} ${time}`; }
    };

    // ============ RENDER: TEST LIST ============
    const renderTestList = () => (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Tests</h2>
                    <p className="text-neutral-500 mt-1">Create and manage assessments for your candidates</p>
                </div>
                <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Test
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                </div>
            ) : tests.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <ClipboardCheck className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-700">No tests yet</h3>
                    <p className="text-neutral-500 mt-2">Create your first test to assess candidates</p>
                    <button
                        onClick={() => setActiveTab('create')}
                        className="mt-4 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors font-medium"
                    >
                        Create Test
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tests.map(test => (
                        <div key={test.id} className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-neutral-900">{test.title}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${test.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                                            test.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                                                'bg-neutral-100 text-neutral-600'
                                            }`}>
                                            {test.status === 'published' ? 'Published' : test.status === 'draft' ? 'Draft' : 'Closed'}
                                        </span>
                                        {test.results_published && (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Results Published
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500 mb-3">{test.job_title}</p>
                                    <div className="flex items-center gap-5 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="w-4 h-4" />
                                            {test.question_count} Questions
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            {test.duration_minutes} min
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            {test.submission_count} Submissions
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {formatDateTime(test.start_date, test.start_time)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    {/* Edit button — visible for draft tests and published tests before start */}
                                    {isTestEditable(test) && (
                                        <button
                                            onClick={() => handleEditTest(test)}
                                            className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium flex items-center gap-1"
                                            title={test.status === 'draft' ? 'Edit test' : 'Edit (test has not started yet)'}
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                    )}

                                    {test.status === 'draft' && (
                                        <button
                                            onClick={() => handlePublish(test.id)}
                                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium flex items-center gap-1"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            Publish
                                        </button>
                                    )}

                                    {test.status === 'published' && (
                                        <>
                                            <button
                                                onClick={() => handleViewResults(test)}
                                                className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm font-medium flex items-center gap-1"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Results
                                            </button>
                                            {!test.results_published && parseInt(test.submission_count) > 0 && (
                                                <button
                                                    onClick={() => handlePublishResults(test.id)}
                                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Award className="w-3.5 h-3.5" />
                                                    Publish Results
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Delete button — always available */}
                                    <button
                                        onClick={() => handleDelete(test.id)}
                                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete test"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ============ RENDER: CREATE / EDIT TEST (Google Form Style) ============
    const renderCreateOrEditTest = () => {
        const isEditing = activeTab === 'edit' && editingTestId;
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setActiveTab('list'); resetForm(); }} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">{isEditing ? 'Edit Test' : 'Create Test'}</h2>
                        <p className="text-neutral-500 mt-0.5">{isEditing ? 'Modify test details and questions' : 'Design an assessment for your candidates'}</p>
                    </div>
                </div>

                <form onSubmit={isEditing ? handleUpdateTest : handleCreateTest}>
                    {/* Job Selection */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
                        <h3 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-violet-600" />
                            Select Job
                        </h3>
                        <div className="relative">
                            <select
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                className="w-full appearance-none px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700 font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
                                required
                            >
                                <option value="">— Select a Job —</option>
                                {jobs.map(job => (
                                    <option key={job.job_id} value={job.job_id}>
                                        {job.job_title} ({job.status})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>

                        {selectedJobId && (
                            <div className="mt-4 p-3 bg-violet-50 rounded-lg">
                                <p className="text-sm text-violet-700 font-medium">
                                    {loadingCandidates ? 'Loading candidates...' : `${candidates.length} candidate(s) applied for this job`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Test Details - Google Form Header Style */}
                    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-4">
                        <div className="h-2.5 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
                        <div className="p-6">
                            <input
                                type="text"
                                value={testForm.title}
                                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                                placeholder="Test Title"
                                className="w-full text-2xl font-semibold text-neutral-900 border-0 border-b-2 border-transparent focus:border-violet-500 outline-none pb-2 bg-transparent placeholder-neutral-300"
                                required
                            />
                            <textarea
                                value={testForm.description}
                                onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                                placeholder="Test Description (optional)"
                                className="w-full mt-4 text-sm text-neutral-600 border-0 border-b border-transparent focus:border-neutral-300 outline-none resize-none bg-transparent placeholder-neutral-400"
                                rows={2}
                            />
                            <textarea
                                value={testForm.instructions}
                                onChange={(e) => setTestForm({ ...testForm, instructions: e.target.value })}
                                placeholder="Instructions for candidates (optional)"
                                className="w-full mt-3 text-sm text-neutral-600 border-0 border-b border-transparent focus:border-neutral-300 outline-none resize-none bg-transparent placeholder-neutral-400"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Time & Duration Settings */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
                        <h3 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-violet-600" />
                            Schedule & Duration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Start Date</label>
                                <input type="date" value={testForm.startDate} onChange={(e) => setTestForm({ ...testForm, startDate: e.target.value })} className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Start Time</label>
                                <input type="time" value={testForm.startTime} onChange={(e) => setTestForm({ ...testForm, startTime: e.target.value })} className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1.5">End Date</label>
                                <input type="date" value={testForm.endDate} onChange={(e) => setTestForm({ ...testForm, endDate: e.target.value })} className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1.5">End Time</label>
                                <input type="time" value={testForm.endTime} onChange={(e) => setTestForm({ ...testForm, endTime: e.target.value })} className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Duration (minutes)</label>
                                <input type="number" min={5} max={300} value={testForm.durationMinutes} onChange={(e) => setTestForm({ ...testForm, durationMinutes: parseInt(e.target.value) || 60 })} className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" required />
                            </div>
                        </div>
                    </div>

                    {/* Questions - Google Form Style */}
                    <div className="space-y-4 mb-6">
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-violet-300 transition-colors">
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">
                                                    {qIndex + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={q.questionText}
                                                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                                    placeholder="Question"
                                                    className="flex-1 text-base font-medium text-neutral-900 border-0 border-b-2 border-transparent focus:border-violet-500 outline-none pb-1 bg-transparent placeholder-neutral-400"
                                                    required
                                                />
                                            </div>

                                            {/* Question Type Toggle */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <label className="text-sm text-neutral-500">Type:</label>
                                                <div className="flex bg-neutral-100 rounded-lg p-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuestion(qIndex, 'questionType', 'objective')}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${q.questionType === 'objective' ? 'bg-white text-violet-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                    >
                                                        Objective (MCQ)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuestion(qIndex, 'questionType', 'descriptive')}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${q.questionType === 'descriptive' ? 'bg-white text-violet-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                    >
                                                        Descriptive
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Options for MCQ */}
                                            {q.questionType === 'objective' && (
                                                <div className="space-y-3 mb-4">
                                                    {q.options.map((option, oIndex) => (
                                                        <div key={oIndex} className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${q.expectedAnswer === option && option ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-300 hover:border-violet-400'
                                                                }`}
                                                                onClick={() => { if (option) updateQuestion(qIndex, 'expectedAnswer', option); }}
                                                            >
                                                                {q.expectedAnswer === option && option && (
                                                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                placeholder={`Option ${oIndex + 1}`}
                                                                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-neutral-50"
                                                                required
                                                            />
                                                        </div>
                                                    ))}
                                                    <p className="text-xs text-neutral-400 ml-8">Click the circle to mark the correct answer</p>
                                                </div>
                                            )}

                                            {/* Expected Answer for Descriptive */}
                                            {q.questionType === 'descriptive' && (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-neutral-600 mb-1.5">Expected Answer (hidden from candidate)</label>
                                                    <textarea
                                                        value={q.expectedAnswer}
                                                        onChange={(e) => updateQuestion(qIndex, 'expectedAnswer', e.target.value)}
                                                        placeholder="Enter the expected answer"
                                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-neutral-50 resize-none"
                                                        rows={3}
                                                        required
                                                    />
                                                    <p className="text-xs text-neutral-400 mt-1">This answer will be used for auto-evaluation</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete Question */}
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(qIndex)}
                                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Question Button */}
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Question
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('list'); resetForm(); }}
                            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {isEditing ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <ClipboardCheck className="w-4 h-4" />
                                    {isEditing ? 'Save Changes' : 'Create Test'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // ============ RENDER: RESULTS ============
    const renderResults = () => (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setActiveTab('list'); setSelectedTest(null); setResults(null); }} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-neutral-900">Test Results</h2>
                    {selectedTest && <p className="text-neutral-500 mt-0.5">{selectedTest.title} — {selectedTest.job_title}</p>}
                </div>
                {selectedTest && !selectedTest.results_published && (
                    <button
                        onClick={() => handlePublishResults(selectedTest.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <Award className="w-4 h-4" />
                        Publish Results
                    </button>
                )}
            </div>

            {loadingResults ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                </div>
            ) : !results || results.results.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <Users className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-700">No submissions yet</h3>
                    <p className="text-neutral-500 mt-2">Candidates haven't taken this test yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {results.results.map((result, idx) => (
                        <div key={result.attempt_id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <div
                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                                onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">{result.candidate_name}</p>
                                        <p className="text-sm text-neutral-500">{result.candidate_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-violet-700">
                                            {result.total_score}/{result.max_score}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {result.max_score > 0 ? Math.round((result.total_score / result.max_score) * 100) : 0}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-neutral-600">
                                            {result.time_taken_seconds ? `${Math.floor(result.time_taken_seconds / 60)}m ${result.time_taken_seconds % 60}s` : 'N/A'}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {result.auto_submitted ? 'Auto-submitted' : 'Manual'}
                                        </p>
                                    </div>
                                    {result.violation_count > 0 && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                            {result.violation_count} violations
                                        </span>
                                    )}
                                    <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${expandedResult === idx ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* Expanded answers */}
                            {expandedResult === idx && (
                                <div className="border-t border-neutral-100 p-5 bg-neutral-50">
                                    <div className="space-y-4">
                                        {result.answers.map((ans, aIdx) => (
                                            <div key={aIdx} className="bg-white rounded-lg p-4 border border-neutral-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-medium text-neutral-900">Q{ans.question_order}. {ans.question_text}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ans.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {ans.is_correct ? 'Correct' : 'Incorrect'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-neutral-500 text-xs mb-1">Candidate Answer</p>
                                                        <p className={`font-medium ${ans.is_correct ? 'text-emerald-700' : 'text-red-700'}`}>
                                                            {ans.candidate_answer || '— No answer —'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-neutral-500 text-xs mb-1">Expected Answer</p>
                                                        <p className="font-medium text-neutral-900">{ans.expected_answer}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <DashboardLayout type="provider" title="Tests">
            <div className="max-w-5xl mx-auto">
                {activeTab === 'list' && renderTestList()}
                {(activeTab === 'create' || activeTab === 'edit') && renderCreateOrEditTest()}
                {activeTab === 'results' && renderResults()}
            </div>
        </DashboardLayout>
    );
};

export default TestsPage;
