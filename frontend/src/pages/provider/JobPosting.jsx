import { Briefcase, Clock, DollarSign, MapPin, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Input, Select, Textarea, Toggle } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
const JobPosting = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
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
        remote: false,
    });

    const fetchJobs = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/jobs');
            const data = await response.json();
            if (data.success) {
                setJobs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch jobs on mount
    useState(() => {
        fetchJobs();
    }, []);

    const handlePostJob = async () => {
        try {
            const payload = {
                ...formData,
                // Ensure numbers
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
            };

            const response = await fetch('http://localhost:3000/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                alert('Job posted successfully!');
                setShowForm(false);
                setFormData({
                    job_title: '', department: '', job_type: 'Full-time', experience_level: '',
                    location: '', salary_min: '', salary_max: '', job_description: '',
                    required_skills: '', remote: false
                });
                fetchJobs(); // Refresh list
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error posting job:', error);
            alert('Failed to post job');
        }
    };

    const departmentOptions = [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Product', label: 'Product' },
        { value: 'Design', label: 'Design' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Sales', label: 'Sales' },
        { value: 'HR', label: 'Human Resources' },
    ];

    const typeOptions = [
        { value: 'Full-time', label: 'Full-time' },
        { value: 'Part-time', label: 'Part-time' },
        { value: 'Contract', label: 'Contract' },
        { value: 'Internship', label: 'Internship' },
    ];

    const experienceOptions = [
        { value: 'Entry Level', label: 'Entry Level (0-2 years)' },
        { value: 'Mid Level', label: 'Mid Level (3-5 years)' },
        { value: 'Senior', label: 'Senior (5+ years)' },
        { value: 'Lead', label: 'Lead (10+ years)' },
    ];

    return (
        <DashboardLayout type="provider" title="Post Job">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-100 mb-2">Job Postings</h2>
                        <p className="text-dark-400">Create and manage your job listings.</p>
                    </div>
                    <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowForm(!showForm)}
                    >
                        Create New Job
                    </Button>
                </div>

                {showForm && (
                    <Card className="mb-8 animate-slide-up">
                        <CardHeader>
                            <CardTitle>Create New Job Posting</CardTitle>
                            <CardDescription>Fill in the details below to create a new job listing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Input
                                    label="Job Title"
                                    placeholder="e.g. Senior Frontend Developer"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                                />
                                <Select
                                    label="Department"
                                    options={departmentOptions}
                                    value={formData.department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                    placeholder="Select department"
                                />
                                <Select
                                    label="Job Type"
                                    options={typeOptions}
                                    value={formData.job_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, job_type: e.target.value }))}
                                />
                                <Select
                                    label="Experience Level"
                                    options={experienceOptions}
                                    value={formData.experience_level}
                                    onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                                    placeholder="Select experience level"
                                />
                                <Input
                                    label="Location"
                                    placeholder="e.g. San Francisco, CA"
                                    leftIcon={<MapPin className="w-4 h-4" />}
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Min Salary"
                                        placeholder="Min"
                                        type="number"
                                        leftIcon={<DollarSign className="w-4 h-4" />}
                                        value={formData.salary_min}
                                        onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                                    />
                                    <Input
                                        label="Max Salary"
                                        placeholder="Max"
                                        type="number"
                                        leftIcon={<DollarSign className="w-4 h-4" />}
                                        value={formData.salary_max}
                                        onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Textarea
                                        label="Job Description"
                                        placeholder="Describe the role, responsibilities, and requirements..."
                                        rows={6}
                                        value={formData.job_description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, job_description: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Required Skills"
                                        placeholder="e.g. React, TypeScript, Node.js (comma separated)"
                                        value={formData.required_skills}
                                        onChange={(e) => setFormData(prev => ({ ...prev, required_skills: e.target.value }))}
                                        hint="Enter skills separated by commas"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-dark-700">
                                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button onClick={handlePostJob}>Post Job</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Your Job Postings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {jobs.map((job, index) => (
                                <div
                                    key={job.job_id}
                                    className="flex items-center justify-between p-6 bg-dark-700/30 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary-500/20 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-primary-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-dark-100">{job.job_title}</h3>
                                                <Badge
                                                    variant={job.status === 'Open' ? 'success' : 'warning'}
                                                    size="sm"
                                                >
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-dark-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location || 'Remote'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {job.salary_min && job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : 'Competitive'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    Posted {new Date(job.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-lg font-semibold text-primary-400">
                                                <Users className="w-5 h-5" />
                                                0
                                            </div>
                                            <p className="text-xs text-dark-500">applicants</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};
export default JobPosting;
