import { Briefcase, Clock, DollarSign, MapPin, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Input, Select, Textarea, Toggle } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { postedJobs } from '../../mockData/companies';

/**
 * Job Posting page
 * Create and manage job postings
 */
const JobPosting = () => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        department: '',
        location: '',
        type: 'full-time',
        experience: '',
        salary: '',
        skills: '',
        remote: false,
    });

    const departmentOptions = [
        { value: 'engineering', label: 'Engineering' },
        { value: 'product', label: 'Product' },
        { value: 'design', label: 'Design' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Sales' },
        { value: 'hr', label: 'Human Resources' },
    ];

    const typeOptions = [
        { value: 'full-time', label: 'Full-time' },
        { value: 'part-time', label: 'Part-time' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' },
    ];

    const experienceOptions = [
        { value: '0-2', label: 'Entry Level (0-2 years)' },
        { value: '3-5', label: 'Mid Level (3-5 years)' },
        { value: '5+', label: 'Senior (5+ years)' },
        { value: '10+', label: 'Lead (10+ years)' },
    ];

    return (
        <DashboardLayout type="provider" title="Post Job">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-100 mb-2">
                            Job Postings
                        </h2>
                        <p className="text-dark-400">
                            Create and manage your job listings.
                        </p>
                    </div>
                    <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowForm(!showForm)}
                    >
                        Create New Job
                    </Button>
                </div>

                {/* Create Job Form */}
                {showForm && (
                    <Card className="mb-8 animate-slide-up">
                        <CardHeader>
                            <CardTitle>Create New Job Posting</CardTitle>
                            <CardDescription>
                                Fill in the details below to create a new job listing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Input
                                    label="Job Title"
                                    placeholder="e.g. Senior Frontend Developer"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                />
                                <Select
                                    label="Experience Level"
                                    options={experienceOptions}
                                    value={formData.experience}
                                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                                    placeholder="Select experience level"
                                />
                                <Input
                                    label="Location"
                                    placeholder="e.g. San Francisco, CA"
                                    leftIcon={<MapPin className="w-4 h-4" />}
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                />
                                <Input
                                    label="Salary Range"
                                    placeholder="e.g. $120k - $150k"
                                    leftIcon={<DollarSign className="w-4 h-4" />}
                                    value={formData.salary}
                                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                                />
                                <div className="md:col-span-2">
                                    <Textarea
                                        label="Job Description"
                                        placeholder="Describe the role, responsibilities, and requirements..."
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Required Skills"
                                        placeholder="e.g. React, TypeScript, Node.js (comma separated)"
                                        value={formData.skills}
                                        onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                                        hint="Enter skills separated by commas"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Toggle
                                        label="Remote Work"
                                        description="This position allows remote work"
                                        checked={formData.remote}
                                        onChange={(checked) => setFormData(prev => ({ ...prev, remote: checked }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-dark-700">
                                <Button variant="secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button variant="outline">
                                    Save as Draft
                                </Button>
                                <Button>
                                    Post Job
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Posted Jobs List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Job Postings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {postedJobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between p-6 bg-dark-700/30 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary-500/20 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-primary-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-dark-100">{job.title}</h3>
                                                <Badge
                                                    variant={job.status === 'active' ? 'success' : 'warning'}
                                                    size="sm"
                                                >
                                                    {job.status}
                                                </Badge>
                                                {job.remote && (
                                                    <Badge variant="info" size="sm">Remote</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-dark-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {job.salary}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    Posted {job.posted}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-lg font-semibold text-primary-400">
                                                <Users className="w-5 h-5" />
                                                {job.applicants}
                                            </div>
                                            <p className="text-xs text-dark-500">applicants</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm">
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
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
