import { Briefcase, Clock, DollarSign, MapPin, Plus, Users, Trash2, X, PlayCircle, PauseCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Input, Select, Textarea, Toggle } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../api/axios';
import { updateJobStatus, deleteJob } from '../../api/jobs';

const JobPosting = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [editingJobId, setEditingJobId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        job_title: '',
        department: '',
        job_type: 'Full-time',
        experience_level: '',
        location: '',
        salary_min: '',
        salary_max: '',
        job_description: '',
        required_skills: '',
        required_education: '',
        remote: false,
        require_education: false,
        require_skills: false
    });

    // Dynamic Requirements State
    const [requirements, setRequirements] = useState([
        { requirement_text: '', is_mandatory: true }
    ]);

    // Dynamic Questions State (with expected_answer for recruiter reference)
    const [questions, setQuestions] = useState([
        { question_text: '', question_type: 'text', options: [], is_required: true, expected_answer: '' }
    ]);

    // Job Expectations State (NEW)
    const [expectations, setExpectations] = useState({
        expected_experience_years: '',
        expected_education: '',
        notes: ''
    });

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs/recruiter');
            if (response.data.success) {
                setJobs(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Helper to Add/Remove Requirements
    const addRequirement = () => {
        setRequirements([...requirements, { requirement_text: '', is_mandatory: true }]);
    };

    const removeRequirement = (index) => {
        const newReqs = [...requirements];
        newReqs.splice(index, 1);
        setRequirements(newReqs);
    };

    const updateRequirement = (index, field, value) => {
        const newReqs = [...requirements];
        newReqs[index][field] = value;
        setRequirements(newReqs);
    };

    // Helper to Add/Remove Questions
    const addQuestion = () => {
        setQuestions([...questions, { question_text: '', question_type: 'text', options: [], is_required: true, expected_answer: '' }]);
    };

    const removeQuestion = (index) => {
        const newQs = [...questions];
        newQs.splice(index, 1);
        setQuestions(newQs);
    };

    const updateQuestion = (index, field, value) => {
        const newQs = [...questions];

        // Handle options separately
        if (field === 'options') {
            // value is string "opt1, opt2"
            newQs[index].options = value.split(',').map(o => o.trim());
        } else {
            newQs[index][field] = value;
        }
        setQuestions(newQs);
    };


    const handlePostJob = async () => {
        try {
            const payload = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                requirements: requirements.filter(r => r.requirement_text.trim() !== ''),
                questions: questions.filter(q => q.question_text.trim() !== ''),
                job_expectations: {
                    expected_experience_years: expectations.expected_experience_years ? parseInt(expectations.expected_experience_years) : null,
                    expected_education: expectations.expected_education || null,
                    notes: expectations.notes || null
                }
            };

            let response;
            if (editingJobId) {
                response = await api.put(`/jobs/${editingJobId}`, payload);
            } else {
                response = await api.post('/jobs', payload);
            }

            if (response.data.success) {
                alert(editingJobId ? 'Job updated successfully!' : 'Job posted successfully!');
                setShowForm(false);
                setEditingJobId(null); // Reset
                setFormData({
                    job_title: '', department: '', job_type: 'Full-time', experience_level: '',
                    location: '', salary_min: '', salary_max: '', job_description: '',
                    required_skills: '', required_education: '', remote: false
                });
                setRequirements([{ requirement_text: '', is_mandatory: true }]);
                setQuestions([{ question_text: '', question_type: 'text', options: [], is_required: true }]);
                setExpectations({ expected_experience_years: '', expected_education: '', notes: '' });
                fetchJobs();
            }
        } catch (error) {
            console.error('Error saving job:', error);
            const msg = error.response?.data?.message || 'Failed to save job';
            alert(msg);
        }
    };

    const handleManageClick = async (job) => {
        setEditingJobId(job.job_id); // Set ID

        // Populate Form
        setFormData({
            job_title: job.job_title,
            department: job.department,
            job_type: job.job_type,
            experience_level: job.experience_level,
            location: job.location,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            job_description: job.job_description,
            required_skills: job.required_skills,
            required_education: job.required_education || '',
            remote: job.location?.toLowerCase() === 'remote',
            require_education: job.require_education || false,
            require_skills: job.require_skills || false
        });

        // We need to fetch requirements and questions for THIS job because the list only has basic info
        try {
            const res = await api.get(`/jobs/${job.job_id}`);
            if (res.data.success) {
                const fullJob = res.data.data;
                setRequirements(fullJob.requirements.length > 0 ? fullJob.requirements : [{ requirement_text: '', is_mandatory: true }]);
                const mappedQuestions = fullJob.questions.map(q => ({
                    ...q,
                    options: q.options || [] // Ensure array
                }));
                setQuestions(mappedQuestions.length > 0 ? mappedQuestions : [{ question_text: '', question_type: 'text', options: [], is_required: true }]);

                // Load expectations (NEW)
                if (fullJob.expectations) {
                    setExpectations({
                        expected_experience_years: fullJob.expectations.expected_experience_years || '',
                        expected_education: fullJob.expectations.expected_education || '',
                        notes: fullJob.expectations.notes || ''
                    });
                } else {
                    setExpectations({ expected_experience_years: '', expected_education: '', notes: '' });
                }
            }
        } catch (err) {
            console.error("Failed to load details", err);
        }

        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingJobId(null);
        setFormData({
            job_title: '', department: '', job_type: 'Full-time', experience_level: '',
            location: '', salary_min: '', salary_max: '', job_description: '',
            required_skills: '', required_education: '', remote: false,
            require_education: false, require_skills: false
        });
        setRequirements([{ requirement_text: '', is_mandatory: true }]);
        setQuestions([{ question_text: '', question_type: 'text', options: [], is_required: true, expected_answer: '' }]);
        setExpectations({ expected_experience_years: '', expected_education: '', notes: '' });
        setShowForm(true);
    };

    // Job Status Management Handlers
    const handleStatusChange = async (jobId, newStatus) => {
        try {
            await updateJobStatus(jobId, newStatus);
            await fetchJobs(); // Refresh the list
        } catch (error) {
            console.error('Failed to update job status:', error);
            alert('Failed to update job status. Please try again.');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone and the job will be hidden from all job seekers.')) {
            return;
        }
        try {
            await deleteJob(jobId);
            await fetchJobs(); // Refresh the list
        } catch (error) {
            console.error('Failed to delete job:', error);
            alert('Failed to delete job. Please try again.');
        }
    };

    return (
        <DashboardLayout type="provider" title="Job Management">
            {!showForm ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-neutral-900">Posted Jobs</h2>
                        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddNew}>
                            Post New Job
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <Card key={job.job_id} className="hover:border-primary-200 hover:shadow-sm transition-all duration-200">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-neutral-900">{job.job_title}</h3>
                                                <Badge>{job.job_type}</Badge>
                                                <Badge variant={job.status === 'Open' ? 'success' : 'warning'}>
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-4 h-4" /> {job.department}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" /> {job.location || 'Remote'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" /> ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                                                </span>
                                                {job.required_skills && (
                                                    <span className="flex items-center gap-1">
                                                        <Badge variant="outline">Skills: {job.required_skills}</Badge>
                                                    </span>
                                                )}
                                                {job.required_education && (
                                                    <span className="flex items-center gap-1 text-sm text-neutral-500">
                                                        🎓 {job.required_education}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Status Management Buttons */}
                                            {job.status?.toLowerCase() === 'open' && (
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(job.job_id, 'closed')}
                                                    leftIcon={<PauseCircle className="w-4 h-4" />}
                                                >
                                                    Close
                                                </Button>
                                            )}
                                            {job.status?.toLowerCase() === 'closed' && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(job.job_id, 'open')}
                                                    leftIcon={<PlayCircle className="w-4 h-4" />}
                                                >
                                                    Reopen
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteJob(job.job_id)}
                                                leftIcon={<Trash2 className="w-4 h-4" />}
                                            >
                                                Delete
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleManageClick(job)}>Manage</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" onClick={() => setShowForm(false)}>← Back to Jobs</Button>
                        <h2 className="text-2xl font-bold text-neutral-900">
                            {editingJobId ? 'Edit Job Posting' : 'Create New Job Posting'}
                        </h2>
                    </div>

                    <div className="space-y-8">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Key details about the role</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Job Title"
                                        placeholder="e.g. Senior Frontend Engineer"
                                        required
                                        value={formData.job_title}
                                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    />
                                    <Input
                                        label="Department"
                                        placeholder="e.g. Engineering"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Job Type"
                                        options={[
                                            { value: 'Full-time', label: 'Full-time' },
                                            { value: 'Part-time', label: 'Part-time' },
                                            { value: 'Contract', label: 'Contract' },
                                            { value: 'Remote', label: 'Remote' },
                                            { value: 'Internship', label: 'Internship' }
                                        ]}
                                        value={formData.job_type}
                                        onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                    />
                                    <Select
                                        label="Experience Level Required"
                                        required
                                        options={[
                                            { value: 'Fresher', label: 'Fresher (0 years)' },
                                            { value: 'Junior', label: 'Junior (1-3 years)' },
                                            { value: 'Mid', label: 'Mid-Level (3-5 years)' },
                                            { value: 'Senior', label: 'Senior (5-8 years)' },
                                            { value: 'Lead', label: 'Lead (8+ years)' }
                                        ]}
                                        value={formData.experience_level}
                                        onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Location"
                                        placeholder="e.g. San Francisco, CA"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                    <div className="flex items-end mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-neutral-600">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-neutral-300 bg-white text-primary-600 focus:ring-primary-500"
                                                checked={formData.remote}
                                                onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
                                            />
                                            Remote Position
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Min Salary ($)"
                                        type="number"
                                        value={formData.salary_min}
                                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    />
                                    <Input
                                        label="Max Salary ($)"
                                        type="number"
                                        value={formData.salary_max}
                                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                    />
                                </div>

                                <Textarea
                                    label="Job Description"
                                    rows={6}
                                    required
                                    value={formData.job_description}
                                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                                />

                                <Input
                                    label="Required Skills (comma separated)"
                                    placeholder="React, Node.js, PostgreSQL..."
                                    required
                                    value={formData.required_skills}
                                    onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                                />
                                <Input
                                    label="Required Educational Qualification"
                                    placeholder="e.g. Bachelor's in Computer Science or equivalent"
                                    value={formData.required_education}
                                    onChange={(e) => setFormData({ ...formData, required_education: e.target.value })}
                                />
                            </CardContent>
                        </Card>

                        {/* Additional Applicant Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Applicant Information</CardTitle>
                                <CardDescription>Select information to require from applicants</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                    <div>
                                        <h4 className="text-neutral-900 font-medium">Require Education Details</h4>
                                        <p className="text-sm text-neutral-500">Ask applicants to share their education history</p>
                                    </div>
                                    <Toggle
                                        label=""
                                        checked={formData.require_education}
                                        onChange={(checked) => setFormData({ ...formData, require_education: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                    <div>
                                        <h4 className="text-neutral-900 font-medium">Require Skills Selection</h4>
                                        <p className="text-sm text-neutral-500">Ask applicants to select relevant skills from their profile</p>
                                    </div>
                                    <Toggle
                                        label=""
                                        checked={formData.require_skills}
                                        onChange={(checked) => setFormData({ ...formData, require_skills: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requirements Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Job Requirements</CardTitle>
                                        <CardDescription>Specific requirements candidates must meet</CardDescription>
                                    </div>
                                    <Button size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />} onClick={addRequirement}>
                                        Add Requirement
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {requirements.map((req, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="flex-1">
                                            <Input
                                                placeholder={`Requirement #${idx + 1}`}
                                                value={req.requirement_text}
                                                onChange={(e) => updateRequirement(idx, 'requirement_text', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center pt-3 gap-2">
                                            <input
                                                type="checkbox"
                                                checked={req.is_mandatory}
                                                onChange={(e) => updateRequirement(idx, 'is_mandatory', e.target.checked)}
                                                className="w-4 h-4 rounded border-neutral-300 bg-white text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-neutral-500">Mandatory</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-1"
                                            onClick={() => removeRequirement(idx)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Screening Questions Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Screening Questions</CardTitle>
                                        <CardDescription>Questions candidates must answer when applying</CardDescription>
                                    </div>
                                    <Button size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />} onClick={addQuestion}>
                                        Add Question
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-medium text-neutral-600">Question #${idx + 1}</h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 h-8 px-2"
                                                onClick={() => removeQuestion(idx)}
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <Input
                                                    placeholder="Question Text (e.g. How many years of experience?)"
                                                    value={q.question_text}
                                                    onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                                                />
                                            </div>
                                            <Select
                                                options={[
                                                    { value: 'text', label: 'Short Text' },
                                                    { value: 'number', label: 'Number' },
                                                    { value: 'boolean', label: 'Yes/No' },
                                                    { value: 'dropdown', label: 'Dropdown' }
                                                ]}
                                                value={q.question_type}
                                                onChange={(e) => updateQuestion(idx, 'question_type', e.target.value)}
                                            />
                                        </div>

                                        {q.question_type === 'dropdown' && (
                                            <Input
                                                placeholder="Options (comma separated, e.g. Remote, Hybrid, Onsite)"
                                                value={q.options ? q.options.join(', ') : ''}
                                                onChange={(e) => updateQuestion(idx, 'options', e.target.value)}
                                            />
                                        )}

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={q.is_required}
                                                onChange={(e) => updateQuestion(idx, 'is_required', e.target.checked)}
                                                className="w-4 h-4 rounded border-neutral-300 bg-white text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-neutral-500">Required answer</span>
                                        </div>

                                        {/* Expected Answer - Recruiter Only Field */}
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <Textarea
                                                label="Expected Answer (For Your Reference Only)"
                                                placeholder="Enter the expected or ideal answer. This will NOT be shown to candidates."
                                                value={q.expected_answer || ''}
                                                onChange={(e) => updateQuestion(idx, 'expected_answer', e.target.value)}
                                                className="bg-white"
                                            />
                                            <p className="text-xs text-amber-700 mt-1">
                                                ⚠️ This is visible only to you and helps evaluate candidate responses
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Job Expectations Section (NEW) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Job Expectations (Optional)</CardTitle>
                                <CardDescription>These expectations will be visible to candidates when applying</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Expected Experience (Years)"
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 3"
                                        value={expectations.expected_experience_years}
                                        onChange={(e) => setExpectations({ ...expectations, expected_experience_years: e.target.value })}
                                    />
                                    <Input
                                        label="Expected Education"
                                        placeholder="e.g. Bachelor's in Computer Science"
                                        value={expectations.expected_education}
                                        onChange={(e) => setExpectations({ ...expectations, expected_education: e.target.value })}
                                    />
                                </div>
                                <Textarea
                                    label="Internal Notes (Not visible to candidates)"
                                    placeholder="Notes about ideal candidate profile..."
                                    rows={2}
                                    value={expectations.notes}
                                    onChange={(e) => setExpectations({ ...expectations, notes: e.target.value })}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handlePostJob}>
                                {editingJobId ? 'Update Job Posting' : 'Publish Job Posting'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default JobPosting;
