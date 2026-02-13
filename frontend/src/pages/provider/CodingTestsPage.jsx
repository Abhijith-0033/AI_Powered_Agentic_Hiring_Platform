import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Code, Eye, Send, CheckCircle, X, FileCode, Clock, Calendar, Users, Award, ChevronRight, Edit3, Save, Info, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import codingService from '../../services/codingService';
import MonacoCodeEditor from '../../components/coding/MonacoCodeEditor';
import SubmissionCodeModal from '../../components/coding/SubmissionCodeModal';
import axios from '../../api/axios';

const CodingTestsPage = () => {
    const [activeTab, setActiveTab] = useState('list'); // list | create | edit | results
    const [editingTestId, setEditingTestId] = useState(null);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Create test state
    const [selectedJobId, setSelectedJobId] = useState('');
    const [testForm, setTestForm] = useState({
        title: '',
        description: '',
        timeLimit: 60,
        totalMarks: 100
    });
    const [questions, setQuestions] = useState([
        {
            title: '',
            problemStatement: '',
            inputFormat: '',
            outputFormat: '',
            constraints: '',
            marks: 50,
            testCases: [
                { input: '', expectedOutput: '', isHidden: false }
            ]
        }
    ]);
    const [saving, setSaving] = useState(false);

    // Results state
    const [selectedTest, setSelectedTest] = useState(null);
    const [results, setResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);

    // View Code Modal state
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);

    // Initial fetch
    useEffect(() => {
        fetchTests();
        fetchJobs();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const res = await codingService.getRecruiterCodingTests();
            setTests(res.data || []);
        } catch (error) {
            console.error('Error fetching coding tests:', error);
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

    // Question Management
    const addQuestion = () => {
        setQuestions([...questions, {
            title: '',
            problemStatement: '',
            inputFormat: '',
            outputFormat: '',
            constraints: '',
            marks: 50,
            testCases: [{ input: '', expectedOutput: '', isHidden: false }]
        }]);
    };

    const removeQuestion = (qIndex) => {
        if (questions.length <= 1) return;
        setQuestions(questions.filter((_, i) => i !== qIndex));
    };

    const updateQuestion = (qIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex] = { ...updated[qIndex], [field]: value };
        setQuestions(updated);
    };

    // Test Case Management
    const addTestCase = (qIndex) => {
        const updated = [...questions];
        updated[qIndex].testCases.push({ input: '', expectedOutput: '', isHidden: false });
        setQuestions(updated);
    };

    const removeTestCase = (qIndex, tcIndex) => {
        const updated = [...questions];
        if (updated[qIndex].testCases.length <= 1) return;
        updated[qIndex].testCases = updated[qIndex].testCases.filter((_, i) => i !== tcIndex);
        setQuestions(updated);
    };

    const updateTestCase = (qIndex, tcIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].testCases[tcIndex] = { ...updated[qIndex].testCases[tcIndex], [field]: value };
        setQuestions(updated);
    };

    // Form Submissions
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!selectedJobId) return alert('Please select a job');
        if (questions.some(q => !q.title.trim() || !q.problemStatement.trim())) {
            return alert('All questions must have a title and problem statement');
        }
        if (questions.some(q => q.testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim()))) {
            return alert('All test cases must have input and expected output');
        }

        const totalQuestionMarks = questions.reduce((sum, q) => sum + parseInt(q.marks || 0), 0);
        if (totalQuestionMarks !== parseInt(testForm.totalMarks)) {
            if (!confirm(`Total question marks (${totalQuestionMarks}) do not match test total marks (${testForm.totalMarks}). Continue?`)) return;
        }

        try {
            setSaving(true);
            const payload = {
                jobId: selectedJobId,
                ...testForm,
                questions
            };

            if (editingTestId) {
                await codingService.updateCodingTest(editingTestId, payload);
                alert('Coding test updated successfully!');
            } else {
                await codingService.createCodingTest(payload);
                alert('Coding test created successfully!');
            }

            setActiveTab('list');
            fetchTests();
            resetForm();
        } catch (error) {
            console.error('Error saving coding test:', error);
            alert('Failed to save coding test');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingTestId(null);
        setSelectedJobId('');
        setTestForm({ title: '', description: '', timeLimit: 60, totalMarks: 100 });
        setQuestions([{
            title: '', problemStatement: '', inputFormat: '', outputFormat: '', constraints: '', marks: 50,
            testCases: [{ input: '', expectedOutput: '', isHidden: false }]
        }]);
    };

    const handleEdit = async (test) => {
        try {
            const res = await codingService.getCodingTestById(test.id);
            const data = res.data;
            setEditingTestId(data.id);
            setSelectedJobId(data.job_id);
            setTestForm({
                title: data.title,
                description: data.description,
                timeLimit: data.time_limit,
                totalMarks: data.total_marks
            });
            setQuestions(data.questions.map(q => ({
                title: q.title,
                problemStatement: q.problem_statement,
                inputFormat: q.input_format,
                outputFormat: q.output_format,
                constraints: q.constraints,
                marks: q.marks,
                testCases: q.testCases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expected_output,
                    isHidden: tc.is_hidden
                }))
            })));
            setActiveTab('edit');
        } catch (error) {
            alert('Failed to load test details');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this test?')) return;
        try {
            await codingService.deleteCodingTest(id);
            fetchTests();
        } catch (error) {
            alert('Failed to delete test');
        }
    };

    const handlePublish = async (id) => {
        if (!confirm('Publishing this test will make it visible to candidates. Continue?')) return;
        try {
            await codingService.publishCodingTest(id);
            alert('Test published successfully!');
            fetchTests();
        } catch (error) {
            alert('Failed to publish test');
        }
    };

    const handleViewResults = async (test) => {
        try {
            setLoadingResults(true);
            setSelectedTest(test);
            setActiveTab('results');
            const res = await codingService.getCodingTestResults(test.id);
            setResults(res.data || []);
        } catch (error) {
            console.error('Error fetching results:', error);
            alert('Failed to fetch results');
        } finally {
            setLoadingResults(false);
        }
    };

    const handlePublishResults = async (testId) => {
        if (!confirm('Publish results to candidates?')) return;
        try {
            await codingService.publishCodingTestResults(testId);
            alert('Results published!');
            fetchTests();
            if (selectedTest?.id === testId) {
                setSelectedTest({ ...selectedTest, results_published: true });
            }
        } catch (error) {
            alert('Failed to publish results');
        }
    };

    const handleViewCode = async (submissionId) => {
        try {
            setLoadingSubmission(true);
            const res = await codingService.getSubmissionById(submissionId);
            setSelectedSubmission(res.data);
            setCodeModalOpen(true);
        } catch (error) {
            console.error('Error fetching submission:', error);
            alert('Failed to load submission details');
        } finally {
            setLoadingSubmission(false);
        }
    };

    // Render Components
    const renderList = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Coding Tests</h2>
                    <p className="text-neutral-500 mt-1">Create algorithmic & coding assessments</p>
                </div>
                <button
                    onClick={() => { setActiveTab('create'); resetForm(); }}
                    className="px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Coding Test
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                </div>
            ) : tests.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Code className="w-8 h-8 text-neutral-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-700">No coding tests yet</h3>
                    <p className="text-neutral-500 mt-2 max-w-sm mx-auto">Create your first coding assessment with custom test cases and problem statements.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tests.map(test => (
                        <div key={test.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-neutral-900">{test.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${test.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                            test.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
                                            }`}>
                                            {test.status}
                                        </span>
                                        {test.results_published && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 flex items-center gap-1">
                                                <Award className="w-3 h-3" />
                                                Results Out
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500">{test.job_title || 'No Job Linked'}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {test.time_limit} mins
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Save className="w-3.5 h-3.5" />
                                            {test.total_marks} Marks
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {test.candidates_attempted} Attempts
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {test.status === 'draft' && (
                                        <>
                                            <button onClick={() => handleEdit(test)} className="p-2 text-neutral-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handlePublish(test.id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold" title="Publish">
                                                Publish
                                            </button>
                                        </>
                                    )}
                                    {test.status === 'published' && (
                                        <button onClick={() => handleViewResults(test)} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors text-xs font-bold flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" />
                                            View Results
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(test.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

    const renderCreateOrEdit = () => (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => { setActiveTab('list'); resetForm(); }} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900">{editingTestId ? 'Edit Coding Test' : 'Create Coding Test'}</h2>
                    <p className="text-neutral-500 mt-1">Configure your coding assessment</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Configuration */}
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <Info className="w-5 h-5 text-violet-600" />
                        Test Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-neutral-700">Link to Job Posting</label>
                            <div className="relative">
                                <select
                                    value={selectedJobId}
                                    onChange={(e) => setSelectedJobId(e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium text-neutral-800"
                                    required
                                >
                                    <option value="">Select a Job</option>
                                    {jobs.map(job => (
                                        <option key={job.job_id} value={job.job_id}>{job.job_title} at {job.company}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-neutral-700">Test Title</label>
                            <input
                                type="text"
                                value={testForm.title}
                                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                                placeholder="e.g. Data Structures & Algorithms - Level 1"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-neutral-700">Time Limit (mins)</label>
                            <input
                                type="number"
                                value={testForm.timeLimit}
                                onChange={(e) => setTestForm({ ...testForm, timeLimit: e.target.value })}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-neutral-700">Total Marks</label>
                            <input
                                type="number"
                                value={testForm.totalMarks}
                                onChange={(e) => setTestForm({ ...testForm, totalMarks: e.target.value })}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-neutral-900">Questions ({questions.length})</h3>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add Question
                        </button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                            <div className="bg-neutral-50 px-6 py-4 flex items-center justify-between border-b border-neutral-100">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-bold ring-4 ring-violet-50">
                                        {qIndex + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={q.title}
                                        onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
                                        placeholder="Question Title (e.g. Reverse a Linked List)"
                                        className="bg-transparent border-none focus:ring-0 text-neutral-900 font-bold placeholder-neutral-400 w-80"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-neutral-500">Marks:</span>
                                        <input
                                            type="number"
                                            value={q.marks}
                                            onChange={(e) => updateQuestion(qIndex, 'marks', e.target.value)}
                                            className="w-16 px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-violet-500"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(qIndex)}
                                        className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Problem Statement</label>
                                    <textarea
                                        value={q.problemStatement}
                                        onChange={(e) => updateQuestion(qIndex, 'problemStatement', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm leading-relaxed"
                                        placeholder="Describe the problem, input format, and constraints in detail..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Input Format</label>
                                        <textarea
                                            value={q.inputFormat}
                                            onChange={(e) => updateQuestion(qIndex, 'inputFormat', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Output Format</label>
                                        <textarea
                                            value={q.outputFormat}
                                            onChange={(e) => updateQuestion(qIndex, 'outputFormat', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Test Cases */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Test Cases</label>
                                        <button
                                            type="button"
                                            onClick={() => addTestCase(qIndex)}
                                            className="text-[10px] font-bold text-violet-600 hover:text-violet-700 uppercase tracking-widest"
                                        >
                                            + Add Test Case
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {q.testCases.map((tc, tcIndex) => (
                                            <div key={tcIndex} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-4 h-28">
                                                <div className="flex-1 space-y-2">
                                                    <textarea
                                                        value={tc.input}
                                                        onChange={(e) => updateTestCase(qIndex, tcIndex, 'input', e.target.value)}
                                                        placeholder="Input"
                                                        className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono resize-none h-18 outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <textarea
                                                        value={tc.expectedOutput}
                                                        onChange={(e) => updateTestCase(qIndex, tcIndex, 'expectedOutput', e.target.value)}
                                                        placeholder="Expected Output"
                                                        className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono resize-none h-18 outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center gap-2 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${tc.isHidden ? 'bg-violet-600 border-violet-600' : 'bg-white border-neutral-300'}`}>
                                                            {tc.isHidden && <CheckCircle className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={tc.isHidden}
                                                            onChange={(e) => updateTestCase(qIndex, tcIndex, 'isHidden', e.target.checked)}
                                                        />
                                                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider group-hover:text-violet-600">Hidden</span>
                                                    </label>
                                                    {q.testCases.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTestCase(qIndex, tcIndex)}
                                                            className="p-1 text-neutral-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="pt-8 border-t border-neutral-200 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('list'); resetForm(); }}
                        className="px-6 py-2.5 text-neutral-500 font-bold hover:text-neutral-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : editingTestId ? 'Save Changes' : 'Create Test'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderResults = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => { setActiveTab('list'); setSelectedTest(null); }} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-neutral-900">Submission Results</h2>
                    <p className="text-neutral-500 mt-1">{selectedTest?.title} — {selectedTest?.job_title}</p>
                </div>
                {selectedTest && !selectedTest.results_published && results.length > 0 && (
                    <button
                        onClick={() => handlePublishResults(selectedTest.id)}
                        className="px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                        <Award className="w-4 h-4" />
                        Publish Results to Candidates
                    </button>
                )}
            </div>

            {loadingResults ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                </div>
            ) : results.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-sm">
                    <Users className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-neutral-700">No submissions found</h3>
                    <p className="text-neutral-500 text-sm mt-1">Candidates haven't completed this test yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Question</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">Language</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">Tests</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Submitted</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {results.map((r, idx) => (
                                <tr key={r.submission_id || idx} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-neutral-900">{r.candidate_name}</span>
                                            <span className="text-xs text-neutral-500">{r.candidate_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-neutral-700 block truncate max-w-[150px]">{r.question_title}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-mono font-bold uppercase text-neutral-600 border border-neutral-200">
                                            {r.language}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${parseFloat(r.score) >= 80 ? 'bg-emerald-50 text-emerald-700' :
                                            parseFloat(r.score) >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {Math.round(r.score)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-medium text-neutral-600">{r.test_cases_passed} / {r.total_test_cases}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs text-neutral-500">
                                            {new Date(r.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleViewCode(r.submission_id)}
                                            className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors inline-flex items-center gap-1.5 font-bold text-xs"
                                            title="View Submitted Code"
                                        >
                                            <FileCode size={16} />
                                            View Code
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <DashboardLayout type="provider" title="Coding Tests">
            <div className="max-w-6xl mx-auto px-4">
                {activeTab === 'list' && renderList()}
                {(activeTab === 'create' || activeTab === 'edit') && renderCreateOrEdit()}
                {activeTab === 'results' && renderResults()}
            </div>

            {/* Submission Code Modal */}
            <SubmissionCodeModal
                open={codeModalOpen}
                onClose={() => setCodeModalOpen(false)}
                submission={selectedSubmission}
            />

            {/* Global Loader for fetching submission */}
            {loadingSubmission && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 border border-neutral-200">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                        <span className="text-sm font-bold text-neutral-700">Loading submission...</span>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CodingTestsPage;
