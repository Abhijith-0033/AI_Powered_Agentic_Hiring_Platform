import { Briefcase, Clock, DollarSign, MapPin, Plus, Users, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Input, Select, Textarea, Toggle } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../api/axios';

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
        remote: false
    });

    // Dynamic Requirements State
    const [requirements, setRequirements] = useState([
        { requirement_text: '', is_mandatory: true }
    ]);

    // Dynamic Questions State
    const [questions, setQuestions] = useState([
        { question_text: '', question_type: 'text', options: [], is_required: true }
    ]);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs');
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
        setQuestions([...questions, { question_text: '', question_type: 'text', options: [], is_required: true }]);
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
                questions: questions.filter(q => q.question_text.trim() !== '')
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
                    required_skills: '', remote: false
                });
                setRequirements([{ requirement_text: '', is_mandatory: true }]);
                setQuestions([{ question_text: '', question_type: 'text', options: [], is_required: true }]);
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
            remote: job.location?.toLowerCase() === 'remote' // logic can be improved
        });

        // We need to fetch requirements and questions for THIS job because the list only has basic info
        // Wait, fetchJobs returns essential info. Does it return reqs/questions?
        // Checking backend route GET /api/jobs ... it usually returns list. 
        // We might need to fetch details or assume list has them.

        // Let's fetch the full details for accuracy
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
            required_skills: '', remote: false
        });
        setRequirements([{ requirement_text: '', is_mandatory: true }]);
        setQuestions([{ question_text: '', question_type: 'text', options: [], is_required: true }]);
        setShowForm(true);
    };

    return (
        <DashboardLayout type="provider" title="Job Management">
            {!showForm ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-dark-100">Posted Jobs</h2>
                        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddNew}>
                            Post New Job
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <Card key={job.job_id} className="hover:border-dark-600 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-dark-100">{job.job_title}</h3>
                                                <Badge>{job.job_type}</Badge>
                                                <Badge variant={job.status === 'Open' ? 'success' : 'warning'}>
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-dark-400">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-4 h-4" /> {job.department}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" /> {job.location || 'Remote'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" /> ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleManageClick(job)}>Manage</Button>
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
                        <h2 className="text-2xl font-bold text-dark-100">
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
                                            { value: 'Freelance', label: 'Freelance' },
                                            { value: 'Internship', label: 'Internship' }
                                        ]}
                                        value={formData.job_type}
                                        onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                    />
                                    <Input
                                        label="Experience Level"
                                        placeholder="e.g. 3-5 years"
                                        required
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
                                        <label className="flex items-center gap-2 cursor-pointer text-dark-300">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
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
                                                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500"
                                            />
                                            <span className="text-sm text-dark-400">Mandatory</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-1"
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
                                    <div key={idx} className="p-4 bg-dark-800/50 rounded-lg border border-dark-700 space-y-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-medium text-dark-300">Question #${idx + 1}</h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 h-8 px-2"
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
                                                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500"
                                            />
                                            <span className="text-sm text-dark-400">Required answer</span>
                                        </div>
                                    </div>
                                ))}
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
