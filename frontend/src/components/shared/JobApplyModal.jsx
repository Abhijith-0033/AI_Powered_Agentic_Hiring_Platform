import { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Select, Badge } from '../ui';
import api from '../../api/axios';
import { applyToJob } from '../../api/applications';
import { getProfileImage, updateUserProfile, uploadResume, uploadProfileImage, getProfileResume } from '../../api/users';

// Profile Components & Helpers
import PersonalInfoForm from '../../components/profile/PersonalInfoForm';
import SkillsForm from '../../components/profile/SkillsForm';
import ExperienceForm from '../../components/profile/ExperienceForm';
import EducationForm from '../../components/profile/EducationForm';
import AchievementsForm from '../../components/profile/AchievementsForm';
import ProjectsForm from '../../components/profile/ProjectsForm';
import ResumeUpload from '../../components/profile/ResumeUpload';
import CandidateProfileContent from './CandidateProfileContent';
import { mapProfileToFrontend, mapProfileToBackend } from '../../utils/profileMapper';

const JobApplyModal = ({ job, isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Details, 2: Profile Verification/Edit, 3: Form
    const [fullJob, setFullJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Profile Data State
    const [profile, setProfile] = useState(null); // Backend Snapshot Structure (for View)
    const [profileState, setProfileState] = useState(null); // Frontend Flattened Structure (for Edit)
    const [profileImageUrl, setProfileImageUrl] = useState(null);

    // Editing State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [resumeFile, setResumeFile] = useState(null); // For Profile Upload
    const [hasResume, setHasResume] = useState(false); // For Profile

    // Application Selection State
    const [selectedEducation, setSelectedEducation] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);

    useEffect(() => {
        if (isOpen && job) {
            fetchJobDetails();
            fetchResumes();
            fetchProfile();
            fetchProfileImageForSnapshot();
            setStep(1);
            setSuccess(false);
            setError('');
            setAnswers({});
            setSelectedEducation([]);
            setSelectedSkills([]);
            setIsEditingProfile(false);
        }
    }, [isOpen, job]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
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
                const data = res.data.data;
                setProfile(data); // Unmapped for View
                const mappedState = mapProfileToFrontend(data);
                setProfileState(mappedState); // Mapped for Edit
                setHasResume(!!data.personal_info?.resume_pdf);

                // Auto-populate selections (Hydration Fix)
                setSelectedEducation(data.education || []);
                setSelectedSkills(data.personal_info?.skills || []);
            } else {
                console.warn("Profile fetch success:false", res.data);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
            // Fallback: Set empty profile to prevent UI crash
            setProfile({
                personal_info: { skills: [] },
                education: [],
                experience: [],
                achievements: [],
                projects: []
            });
            // Also init other states if needed
            setProfileState(mapProfileToFrontend({ personal_info: {} }));
        }
    };

    const fetchProfileImageForSnapshot = async () => {
        try {
            const blob = await getProfileImage();
            if (blob && blob.size > 0) {
                const url = URL.createObjectURL(blob);
                setProfileImageUrl(url);
            }
        } catch (err) { }
    };

    // --- Profile Editing Handlers ---

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const payload = mapProfileToBackend(profileState);
            await updateUserProfile(payload);

            // Handle Resume Upload if selected
            if (resumeFile) {
                try {
                    await uploadResume(resumeFile, { syncProfile: true });
                } catch (rErr) {
                    alert('Profile saved, but resume upload failed.');
                }
            }

            // Refetch to ensure consistency and re-hydrate
            await fetchProfile();
            await fetchResumes();
            setIsEditingProfile(false);
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Failed to save profile: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return alert("Image size must be less than 2MB");

        setIsUploadingImage(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                await uploadProfileImage({ image_data: base64data, image_type: file.type });
                setProfileImageUrl(URL.createObjectURL(file));
                await fetchProfile(); // Update profile data to reflect image url if backend returns it
            };
        } catch (error) {
            alert("Failed to upload image");
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Array Handlers (Shared with Profile.jsx)
    const updateArrayItem = (field, index, key, value) => {
        setProfileState(prev => {
            const newArray = [...(prev[field] || [])];
            newArray[index] = { ...newArray[index], [key]: value };
            return { ...prev, [field]: newArray };
        });
    };
    const addArrayItem = (field, initialItem) => {
        setProfileState(prev => ({ ...prev, [field]: [...(prev[field] || []), initialItem] }));
    };
    const removeArrayItem = (field, index) => {
        setProfileState(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };
    const handleAddSkill = (skillName) => {
        if (skillName && skillName.trim()) {
            setProfileState(prev => ({ ...prev, skills: [...(prev.skills || []), { name: skillName.trim(), level: 'Intermediate', years: 1 }] }));
        }
    };
    const handleRemoveSkill = (skillName) => {
        setProfileState(prev => ({ ...prev, skills: prev.skills.filter(s => s.name !== skillName) }));
    };

    // Resume Handlers for Profile Edit
    const handleViewResume = async () => {
        try {
            const blob = await getProfileResume();
            window.open(URL.createObjectURL(blob), '_blank');
        } catch (e) { alert('No resume found'); }
    };
    const handleDeleteResume = async () => {
        if (window.confirm('Delete resume?')) {
            setProfileState(p => ({ ...p, resumeUrl: '' }));
            setHasResume(false);
        }
    };
    // --------------------------------

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const buildProfileSnapshot = () => {
        const selectedResumeData = resumes.find(r => r.id === selectedResume);
        return {
            personal_info: profile?.personal_info || {},
            profile_image_url: profileImageUrl || null,
            education: profile?.education || [],
            experience: profile?.experience || [],
            skills: profile?.personal_info?.skills || [], // Fix: Extract skills from personal_info
            achievements: profile?.achievements || [],
            projects: profile?.projects || [],
            resume_name: selectedResumeData?.resume_name || '',
            snapshot_timestamp: new Date().toISOString()
        };
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setError('');

            if (!selectedResume) { setError("Please select a resume."); setSubmitting(false); return; }

            const requiredQuestions = fullJob?.questions?.filter(q => q.is_required) || [];
            for (const q of requiredQuestions) {
                if (!answers[q.id] || answers[q.id].toString().trim() === '') {
                    setError(`Please answer: ${q.question_text}`);
                    setSubmitting(false);
                    return;
                }
            }

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

            const payload = {
                resume_id: selectedResume,
                answers: Object.entries(answers).map(([qid, ans]) => ({ question_id: qid, answer: ans.toString() })),
                education: selectedEducation,
                skills: selectedSkills,
                profile_snapshot: buildProfileSnapshot()
            };

            await applyToJob(fullJob.job_id, payload);
            setSuccess(true);
            setTimeout(() => onClose(), 2000);

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
            <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-200 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">
                            {success ? 'Application Submitted!' : (step === 2 && isEditingProfile ? 'Edit Profile' : `Apply for ${job?.job_title || job?.title}`)}
                        </h2>
                        <p className="text-sm text-neutral-500">{job?.company_name || job?.company}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-12 text-neutral-500">Loading details...</div>
                    ) : success ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">Applied Successfully!</h3>
                            <p className="text-neutral-500">The recruiter will review your application shortly.</p>
                        </div>
                    ) : step === 1 ? (
                        // STEP 1: Job Details
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">About the Role</h3>
                                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{fullJob?.job_description}</p>
                            </div>
                            {fullJob?.requirements?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Requirements</h3>
                                    <ul className="space-y-2">
                                        {fullJob.requirements.map(req => (
                                            <li key={req.id} className="flex items-start gap-2 text-neutral-600">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                                                <span className={req.is_mandatory ? "font-medium text-neutral-900" : ""}>
                                                    {req.requirement_text} {req.is_mandatory && <span className="text-red-500 ml-1">*</span>}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep(2)}>Review My Profile</Button>
                            </div>
                        </div>
                    ) : step === 2 ? (
                        // STEP 2: Profile Verification / Edit
                        <div className="space-y-6">
                            {!isEditingProfile ? (
                                <>
                                    <div className="flex justify-between items-center p-4 bg-primary-50 border border-primary-200 rounded-lg">
                                        <p className="text-sm text-primary-700">
                                            <strong>Review Your Profile</strong> - This information will be shared with the recruiter.
                                        </p>
                                        <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(true)}>
                                            Edit Profile
                                        </Button>
                                    </div>

                                    <div className="bg-neutral-50 rounded-lg border border-neutral-200">
                                        <div className="p-6">
                                            <CandidateProfileContent
                                                data={{
                                                    ...profile,
                                                    skills: profile?.personal_info?.skills || [],
                                                    profile_image_url: profileImageUrl
                                                }}
                                                onViewResume={handleViewResume}
                                                resumeUrl={hasResume ? 'exist' : null}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-neutral-200">
                                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                        <Button onClick={() => setStep(3)}>Continue</Button>
                                    </div>
                                </>
                            ) : (
                                // EDIT MODE
                                <div className="space-y-8 animate-fade-in">
                                    <PersonalInfoForm
                                        profile={profileState} setProfile={setProfileState}
                                        profileImage={profileImageUrl} handleImageUpload={handleImageUpload} isUploadingImage={isUploadingImage}
                                    />
                                    <SkillsForm skills={profileState.skills} onAdd={handleAddSkill} onRemove={handleRemoveSkill} />

                                    {!profileState.isFresher && (
                                        <ExperienceForm
                                            experience={profileState.experience}
                                            onUpdate={(i, k, v) => updateArrayItem('experience', i, k, v)}
                                            onAdd={() => addArrayItem('experience', {})}
                                            onRemove={(i) => removeArrayItem('experience', i)}
                                        />
                                    )}
                                    <EducationForm
                                        education={profileState.education}
                                        onUpdate={(i, k, v) => updateArrayItem('education', i, k, v)}
                                        onAdd={() => addArrayItem('education', {})}
                                        onRemove={(i) => removeArrayItem('education', i)}
                                    />
                                    <AchievementsForm
                                        achievements={profileState.achievements}
                                        onUpdate={(i, k, v) => updateArrayItem('achievements', i, k, v)}
                                        onAdd={() => addArrayItem('achievements', {})}
                                        onRemove={(i) => removeArrayItem('achievements', i)}
                                    />
                                    <ProjectsForm
                                        projects={profileState.projects}
                                        onUpdate={(i, k, v) => updateArrayItem('projects', i, k, v)}
                                        onAdd={() => addArrayItem('projects', { technologies: [] })}
                                        onRemove={(i) => removeArrayItem('projects', i)}
                                    />
                                    <ResumeUpload
                                        hasResume={hasResume}
                                        resumeFile={resumeFile}
                                        onSelectFile={setResumeFile}
                                        onDelete={handleDeleteResume}
                                        pViewResume={handleViewResume}
                                        onReupload={setResumeFile} // Simple replace
                                    />

                                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 sticky bottom-0 bg-white p-4 -mx-6 -mb-6 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
                                        <Button variant="secondary" onClick={() => { setIsEditingProfile(false); fetchProfile(); /* Revert */ }}>Cancel</Button>
                                        <Button onClick={handleSaveProfile} loading={savingProfile}>Save & Preview</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // STEP 3: Application Form
                        <div className="space-y-8">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600">
                                    <AlertCircle className="w-5 h-5" /> {error}
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Select Resume</h3>
                                {resumes.length === 0 ? (
                                    <div className="text-center p-6 border border-dashed border-neutral-300 rounded-lg">
                                        <p className="text-neutral-500 mb-3">No resumes found.</p>
                                        <Button size="sm" variant="outline" onClick={() => { setStep(2); setIsEditingProfile(true); }}>Upload in Profile</Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {resumes.map(resume => (
                                            <div key={resume.id} onClick={() => setSelectedResume(resume.id)}
                                                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${selectedResume === resume.id ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'}`}>
                                                <div className="flex items-center gap-3">
                                                    <FileText className={`w-5 h-5 ${selectedResume === resume.id ? 'text-primary-600' : 'text-neutral-500'}`} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-neutral-900">{resume.resume_name}</p>
                                                        <p className="text-xs text-neutral-500">{new Date(resume.created_at).toLocaleDateString()} {resume.is_default && <span className="ml-2 text-primary-600">(Default)</span>}</p>
                                                    </div>
                                                    {selectedResume === resume.id && <CheckCircle className="w-5 h-5 text-primary-600" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {fullJob?.require_education && (
                                <SelectionList title="Education Details (Required)" items={profile?.education || []} selected={selectedEducation} onChange={setSelectedEducation} emptyMsg="No education details found." linkAction={() => { setStep(2); setIsEditingProfile(true); }} renderItem={(edu) => (
                                    <div><p className="font-medium text-neutral-900">{edu.degree}</p><p className="text-sm text-neutral-500">{edu.institution} ({edu.graduation_year})</p></div>
                                )} />
                            )}
                            {fullJob?.require_skills && (
                                <SelectionList title="Relevant Skills (Required)" items={profile?.personal_info?.skills || []} selected={selectedSkills} onChange={setSelectedSkills} emptyMsg="No skills found." linkAction={() => { setStep(2); setIsEditingProfile(true); }} renderItem={(skill) => (
                                    <p className="font-medium text-neutral-900">{skill}</p>
                                )} />
                            )}

                            {fullJob?.questions?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Screening Questions</h3>
                                    <div className="space-y-5">
                                        {fullJob.questions.map(q => (
                                            <div key={q.id}>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{q.question_text} {q.is_required && <span className="text-red-500 ml-1">*</span>}</label>
                                                {q.question_type === 'text' && <Input value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="Your answer..." />}
                                                {q.question_type === 'number' && <Input type="number" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="0" />}
                                                {q.question_type === 'boolean' && (
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`q_${q.id}`} checked={answers[q.id] === 'true'} onChange={() => handleAnswerChange(q.id, 'true')} className="text-primary-600 focus:ring-primary-600" /><span className="text-neutral-700">Yes</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`q_${q.id}`} checked={answers[q.id] === 'false'} onChange={() => handleAnswerChange(q.id, 'false')} className="text-primary-600 focus:ring-primary-600" /><span className="text-neutral-700">No</span></label>
                                                    </div>
                                                )}
                                                {q.question_type === 'dropdown' && <Select options={q.options ? q.options.map(o => ({ value: o, label: o })) : []} value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="Select an option" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-4 border-t border-neutral-200">
                                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Internal Helper for Selection Lists
const SelectionList = ({ title, items, selected, onChange, renderItem, emptyMsg, linkAction }) => (
    <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h3>
        {items.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-neutral-300 rounded-lg">
                <p className="text-neutral-500 mb-3">{emptyMsg}</p>
                {linkAction && <Button size="sm" variant="outline" onClick={linkAction}>Update Profile</Button>}
            </div>
        ) : (
            <div className="space-y-2">
                {items.map(item => {
                    const isSelected = selected.some(s => JSON.stringify(s) === JSON.stringify(item));
                    return (
                        <div key={JSON.stringify(item)} onClick={() => onChange(isSelected ? selected.filter(s => JSON.stringify(s) !== JSON.stringify(item)) : [...selected, item])}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${isSelected ? 'bg-primary-50 border-primary-500' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'}`}>
                            <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'}`}>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="flex-1">{renderItem(item)}</div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

export default JobApplyModal;
