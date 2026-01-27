
import { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Select, Badge, Toggle } from '../ui';
import api from '../../api/axios';
import { applyToJob } from '../../api/applications';

const JobApplyModal = ({ job, isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Details, 2: Form
    const [fullJob, setFullJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // New State for Education & Skills
    const [profile, setProfile] = useState(null);
    const [selectedEducation, setSelectedEducation] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);

    useEffect(() => {
        if (isOpen && job) {
            fetchJobDetails();
            fetchResumes();
            fetchProfile(); // Fetch candidate profile
            setStep(1);
            setSuccess(false);
            setError('');
            setAnswers({});
            setSelectedEducation([]);
            setSelectedSkills([]);
        }
    }, [isOpen, job]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            // Ensure we use the correct ID property
            const id = job.job_id || job.id;
            const res = await api.get(`/jobs/${id}`);
            if (res.data.success) {
                setFullJob(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load job details.");
        } finally {
            setLoading(false);
        }
    };

    const fetchResumes = async () => {
        try {
            const res = await api.get('/candidate/resumes');
            if (res.data.success) {
                setResumes(res.data.data);
                // Auto-select default
                const defaultResume = res.data.data.find(r => r.is_default);
                if (defaultResume) setSelectedResume(defaultResume.id);
            }
        } catch (err) {
            console.error("Failed to fetch resumes", err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get('/candidates/profile');
            if (res.data.success) {
                setProfile(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setError('');

            // Validate Resume
            if (!selectedResume) {
                setError("Please select a resume.");
                setSubmitting(false);
                return;
            }

            // Validate Questions
            const requiredQuestions = fullJob?.questions?.filter(q => q.is_required) || [];
            for (const q of requiredQuestions) {
                if (!answers[q.id] || answers[q.id].toString().trim() === '') {
                    setError(`Please answer: ${q.question_text}`);
                    setSubmitting(false);
                    return;
                }
            }

            // Validate Requirements
            if (fullJob?.require_education && selectedEducation.length === 0) {
                setError("Please select at least one education record.");
                setSubmitting(false);
                return;
            }

            if (fullJob?.require_skills && selectedSkills.length === 0) {
                setError("Please select at least one skill.");
                setSubmitting(false);
                return;
            }

            // Format Payload
            const payload = {
                resume_id: selectedResume,
                answers: Object.entries(answers).map(([qid, ans]) => ({
                    question_id: qid,
                    answer: ans.toString()
                })),
                education: selectedEducation,
                skills: selectedSkills
            };

            await applyToJob(fullJob.job_id, payload);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to apply.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-dark-700 bg-dark-800 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-dark-100">
                            {success ? 'Application Submitted!' : `Apply for ${job?.job_title || job?.title}`}
                        </h2>
                        <p className="text-sm text-dark-400">{job?.company_name || job?.company}</p>
                    </div>
                    <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-12 text-dark-400">Loading details...</div>
                    ) : success ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Applied Successfully!</h3>
                            <p className="text-dark-400">The recruiter will review your application shortly.</p>
                        </div>
                    ) : step === 1 ? (
                        // STEP 1: Job Details & Requirements
                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">About the Role</h3>
                                <p className="text-dark-300 leading-relaxed whitespace-pre-line">
                                    {fullJob?.job_description}
                                </p>
                            </div>

                            {/* Requirements */}
                            {fullJob?.requirements?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Requirements</h3>
                                    <ul className="space-y-2">
                                        {fullJob.requirements.map(req => (
                                            <li key={req.id} className="flex items-start gap-2 text-dark-300">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                                                <span className={req.is_mandatory ? "font-medium text-white" : ""}>
                                                    {req.requirement_text}
                                                    {req.is_mandatory && <span className="text-red-400 ml-1">*</span>}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep(2)}>
                                    Continue to Apply
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // STEP 2: Application Form
                        <div className="space-y-8">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            {/* Resume Selection */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Select Resume</h3>
                                {resumes.length === 0 ? (
                                    <div className="text-center p-6 border border-dashed border-dark-600 rounded-lg">
                                        <p className="text-dark-400 mb-3">No resumes found.</p>
                                        <Button size="sm" variant="outline" onClick={() => window.open('/profile', '_blank')}>
                                            Upload in Profile
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {resumes.map(resume => (
                                            <div
                                                key={resume.id}
                                                className={`
                                                    relative p-4 rounded-lg border cursor-pointer transition-all
                                                    ${selectedResume === resume.id
                                                        ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500'
                                                        : 'bg-dark-700/30 border-dark-600 hover:border-dark-500'}
                                                `}
                                                onClick={() => setSelectedResume(resume.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className={`w-5 h-5 ${selectedResume === resume.id ? 'text-primary-400' : 'text-dark-400'}`} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-dark-100">{resume.resume_name}</p>
                                                        <p className="text-xs text-dark-500">
                                                            {new Date(resume.created_at).toLocaleDateString()}
                                                            {resume.is_default && <span className="ml-2 text-primary-400">(Default)</span>}
                                                        </p>
                                                    </div>
                                                    {selectedResume === resume.id && <CheckCircle className="w-5 h-5 text-primary-500" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Education Selection */}
                            {fullJob?.require_education && (
                                <SelectionList
                                    title="Education Details (Required)"
                                    items={profile?.education || []}
                                    selected={selectedEducation}
                                    onChange={setSelectedEducation}
                                    emptyMsg="No education details found in your profile."
                                    link="/profile"
                                    renderItem={(edu) => (
                                        <div>
                                            <p className="font-medium text-dark-100">{edu.degree}</p>
                                            <p className="text-sm text-dark-400">{edu.institution} ({edu.graduation_year})</p>
                                            {edu.gpa && <p className="text-xs text-dark-500">GPA: {edu.gpa}</p>}
                                        </div>
                                    )}
                                />
                            )}

                            {/* Skills Selection */}
                            {fullJob?.require_skills && (
                                <SelectionList
                                    title="Relevant Skills (Required)"
                                    items={profile?.skills || []}
                                    selected={selectedSkills}
                                    onChange={setSelectedSkills}
                                    emptyMsg="No skills found in your profile."
                                    link="/profile"
                                    renderItem={(skill) => (
                                        <p className="font-medium text-dark-100">{skill}</p>
                                    )}
                                />
                            )}

                            {/* Screening Questions */}
                            {fullJob?.questions?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">Screening Questions</h3>
                                    <div className="space-y-5">
                                        {fullJob.questions.map(q => (
                                            <div key={q.id}>
                                                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                                    {q.question_text}
                                                    {q.is_required && <span className="text-red-400 ml-1">*</span>}
                                                </label>

                                                {q.question_type === 'text' && (
                                                    <Input
                                                        value={answers[q.id] || ''}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        placeholder="Your answer..."
                                                    />
                                                )}

                                                {q.question_type === 'number' && (
                                                    <Input
                                                        type="number"
                                                        value={answers[q.id] || ''}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        placeholder="0"
                                                    />
                                                )}

                                                {q.question_type === 'boolean' && (
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`q_${q.id}`}
                                                                checked={answers[q.id] === 'true'}
                                                                onChange={() => handleAnswerChange(q.id, 'true')}
                                                                className="text-primary-500 focus:ring-primary-500"
                                                            />
                                                            <span className="text-dark-300">Yes</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`q_${q.id}`}
                                                                checked={answers[q.id] === 'false'}
                                                                onChange={() => handleAnswerChange(q.id, 'false')}
                                                                className="text-primary-500 focus:ring-primary-500"
                                                            />
                                                            <span className="text-dark-300">No</span>
                                                        </label>
                                                    </div>
                                                )}

                                                {q.question_type === 'dropdown' && (
                                                    <Select
                                                        options={q.options ? q.options.map(o => ({ value: o, label: o })) : []}
                                                        value={answers[q.id] || ''}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        placeholder="Select an option"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-4 border-t border-dark-700">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Application'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add Helper Components or inline logic for selection
const SelectionList = ({ title, items, selected, onChange, renderItem, emptyMsg, link }) => (
    <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        {items.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-dark-600 rounded-lg">
                <p className="text-dark-400 mb-3">{emptyMsg}</p>
                {link && (
                    <Button size="sm" variant="outline" onClick={() => window.open(link, '_blank')}>
                        Update Profile
                    </Button>
                )}
            </div>
        ) : (
            <div className="space-y-2">
                {items.map(item => {
                    const isSelected = selected.some(s => JSON.stringify(s) === JSON.stringify(item));
                    return (
                        <div
                            key={JSON.stringify(item)}
                            className={`
                                p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3
                                ${isSelected
                                    ? 'bg-primary-500/10 border-primary-500'
                                    : 'bg-dark-700/30 border-dark-600 hover:border-dark-500'}
                            `}
                            onClick={() => {
                                if (isSelected) {
                                    onChange(selected.filter(s => JSON.stringify(s) !== JSON.stringify(item)));
                                } else {
                                    onChange([...selected, item]);
                                }
                            }}
                        >
                            <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-dark-500'}`}>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="flex-1">
                                {renderItem(item)}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

export default JobApplyModal;
