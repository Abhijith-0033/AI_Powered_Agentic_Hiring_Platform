import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import { getUserProfile, updateUserProfile, updateFresherStatus, getProfileResume, uploadResume, getProfileImage, uploadProfileImage } from '../../api/users';

// Profile Components
import PersonalInfoForm from '../../components/profile/PersonalInfoForm';
import SkillsForm from '../../components/profile/SkillsForm';
import ExperienceForm from '../../components/profile/ExperienceForm';
import EducationForm from '../../components/profile/EducationForm';
import AchievementsForm from '../../components/profile/AchievementsForm';
import ProjectsForm from '../../components/profile/ProjectsForm';
import ResumeUpload from '../../components/profile/ResumeUpload';

const Profile = () => {
    const [profile, setProfile] = useState({
        name: '', title: '', email: '', phone: '', location: '',
        linkedin: '', github: '', about: '',
        avatar: '',
        skills: [],
        experience: [],
        education: [],
        achievements: [],
        projects: [],
        profileCompletion: 0,
        isFresher: true,
        experienceYears: 0,
        resumeUrl: ''
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [hasResume, setHasResume] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getUserProfile();

                // Fetch Profile Image
                try {
                    const blob = await getProfileImage();
                    if (blob && blob.size > 0) {
                        setProfileImage(URL.createObjectURL(blob));
                    }
                } catch (imgErr) {
                    // Ignore 404
                }

                if (data && data.data) {
                    const { personal_info, education, experience, achievements, projects } = data.data;

                    // Map backend response to frontend state
                    const mappedProfile = {
                        name: personal_info?.name || '',
                        title: '', // Not in backend schema
                        email: personal_info?.email || '',
                        phone: personal_info?.phone_number || '',
                        location: personal_info?.location || '',
                        linkedin: personal_info?.linkedin_url || '',
                        github: personal_info?.github_url || '',
                        about: personal_info?.profile_description || '',
                        avatar: '',
                        skills: (personal_info?.skills || []).map(s => ({ name: s, level: 'Intermediate', years: 1 })),

                        experience: (experience || []).map(exp => ({
                            id: exp.id,
                            title: exp.job_title,
                            company: exp.company_name,
                            location: exp.location,
                            employmentType: exp.employment_type,
                            startDate: exp.start_date ? exp.start_date.split('T')[0] : '', // Format YYYY-MM-DD
                            endDate: exp.end_date ? exp.end_date.split('T')[0] : '',
                            current: exp.is_current,
                            description: exp.description
                        })),

                        education: (education || []).map(edu => ({
                            id: edu.id,
                            degree: edu.degree,
                            school: edu.institution,
                            fieldOfStudy: edu.field_of_study,
                            startDate: edu.start_date ? edu.start_date.split('T')[0] : '',
                            endDate: edu.end_date ? edu.end_date.split('T')[0] : '',
                            grade: edu.grade_or_cgpa,
                            description: edu.description
                        })),

                        achievements: (achievements || []).map(ach => ({
                            id: ach.id,
                            title: ach.title,
                            issuer: ach.issuer,
                            date: ach.date ? ach.date.split('T')[0] : '',
                            description: ach.description
                        })),

                        projects: (projects || []).map(proj => ({
                            id: proj.id,
                            title: proj.project_title,
                            link: proj.project_link,
                            technologies: proj.technologies_used || [],
                            startDate: proj.start_date ? proj.start_date.split('T')[0] : '',
                            endDate: proj.end_date ? proj.end_date.split('T')[0] : '',
                            description: proj.project_description
                        })),

                        profileCompletion: 0,
                        isFresher: personal_info?.is_fresher !== undefined ? personal_info.is_fresher : true,
                        experienceYears: personal_info?.experience_years || 0,
                        resumeUrl: personal_info?.resume_pdf ? 'Resume Uploaded' : ''
                    };

                    setProfile(mappedProfile);
                    setHasResume(!!personal_info?.resume_pdf);
                } else {
                    setError('No profile data received');
                }
            } catch (error) {
                console.error('[Profile] Failed to fetch profile:', error);
                setError(error.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAddSkill = (skillName) => {
        setProfile(prev => ({
            ...prev,
            skills: [...(prev.skills || []), { name: skillName, level: 'Intermediate', years: 1 }]
        }));
    };

    const handleRemoveSkill = (skillName) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s.name !== skillName)
        }));
    };

    const handleImageUpload = async (file) => {
        if (!file) return;

        // Validate size (2MB) and type
        if (file.size > 2 * 1024 * 1024) {
            alert("Image size must be less than 2MB");
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert("Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        setIsUploadingImage(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                await uploadProfileImage({
                    image_data: base64data,
                    image_type: file.type
                });

                setProfileImage(URL.createObjectURL(file));
                alert("Profile image updated!");
                window.location.reload();
            };
        } catch (error) {
            console.error(error);
            alert("Failed to upload image");
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Generic Helper to Update Array Item
    const updateArrayItem = (field, index, key, value) => {
        setProfile(prev => {
            const newArray = [...(prev[field] || [])];
            newArray[index] = { ...newArray[index], [key]: value };
            return { ...prev, [field]: newArray };
        });
    };

    // Generic Helper to Add Array Item
    const addArrayItem = (field, initialItem) => {
        setProfile(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), initialItem]
        }));
    };

    // Generic Helper to Remove Array Item
    const removeArrayItem = (field, index) => {
        setProfile(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                personal_info: {
                    name: profile.name,
                    email: profile.email,
                    phone_number: profile.phone,
                    location: profile.location,
                    github_url: profile.github,
                    linkedin_url: profile.linkedin,
                    is_fresher: profile.isFresher,
                    experience_years: profile.isFresher ? 0 : parseInt(profile.experienceYears || 0),
                    skills: (profile.skills || []).map(s => s.name),
                    profile_description: profile.about
                },

                experience: (profile.experience || []).map(e => ({
                    job_title: e.title,
                    company_name: e.company,
                    location: e.location,
                    employment_type: e.employmentType,
                    start_date: e.startDate,
                    end_date: e.endDate,
                    is_current: e.current,
                    description: e.description
                })),

                education: (profile.education || []).map(e => ({
                    institution: e.school,
                    degree: e.degree,
                    field_of_study: e.fieldOfStudy,
                    start_date: e.startDate,
                    end_date: e.endDate,
                    grade_or_cgpa: e.grade,
                    description: e.description,
                    graduation_year: e.endDate ? new Date(e.endDate).getFullYear() : null // Fallback
                })),

                achievements: (profile.achievements || []).map(a => ({
                    title: a.title,
                    issuer: a.issuer,
                    date: a.date,
                    description: a.description
                })),

                projects: (profile.projects || []).map(p => ({
                    project_title: p.title,
                    project_description: p.description,
                    technologies_used: p.technologies,
                    project_link: p.link,
                    start_date: p.startDate,
                    end_date: p.endDate
                }))
            };

            await updateUserProfile(payload);

            // Resume Upload
            if (resumeFile && resumeFile instanceof File) {
                try {
                    await uploadResume(resumeFile, { syncProfile: true });
                    setHasResume(true);
                    setResumeFile(null);
                } catch (resumeError) {
                    alert('Profile saved, but resume upload failed: ' + (resumeError.response?.data?.message || resumeError.message));
                    setSaving(false);
                    return;
                }
            }

            alert('Profile saved successfully!');
            // Reload to fetch synced IDs etc.
            window.location.reload();

        } catch (error) {
            console.error('[Profile Save] Failed:', error);
            alert('Failed to save profile: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // ... Resume Handlers (Keep same logic) ...
    const handleViewResume = async () => {
        try {
            const blob = await getProfileResume();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            if (error.response?.status === 404) alert('No resume found.');
            else alert('Failed to load resume.');
        }
    };

    const handleReuploadResume = async (file) => {
        if (!file) return;
        setSaving(true);
        try {
            await uploadResume(file, { syncProfile: true });
            setHasResume(true);
            setResumeFile(null);
            alert('Resume re-uploaded successfully!');
        } catch (error) {
            alert('Failed to re-upload resume');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteResume = async () => {
        const confirmed = window.confirm('Delete resume?');
        if (!confirmed) return;
        setSaving(true);
        try {
            setHasResume(false);
            setProfile({ ...profile, resumeUrl: '' });
            alert('Resume deleted locally. Click Save to persist changes.');
        } catch (error) {
            alert('Failed to delete resume');
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <DashboardLayout type="user" title="Profile">
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout type="user" title="Profile">
                <div className="text-center py-20 text-error-500">{error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="user" title="Profile">
            <div className="max-w-4xl mx-auto pb-10">
                <PersonalInfoForm
                    profile={profile}
                    setProfile={setProfile}
                    profileImage={profileImage}
                    handleImageUpload={handleImageUpload}
                    isUploadingImage={isUploadingImage}
                />

                <SkillsForm
                    skills={profile.skills}
                    onAdd={handleAddSkill}
                    onRemove={handleRemoveSkill}
                />

                {!profile.isFresher && (
                    <ExperienceForm
                        experience={profile.experience}
                        onUpdate={(index, key, value) => updateArrayItem('experience', index, key, value)}
                        onAdd={() => addArrayItem('experience', {})}
                        onRemove={(index) => removeArrayItem('experience', index)}
                    />
                )}

                <EducationForm
                    education={profile.education}
                    onUpdate={(index, key, value) => updateArrayItem('education', index, key, value)}
                    onAdd={() => addArrayItem('education', {})}
                    onRemove={(index) => removeArrayItem('education', index)}
                />

                <AchievementsForm
                    achievements={profile.achievements}
                    onUpdate={(index, key, value) => updateArrayItem('achievements', index, key, value)}
                    onAdd={() => addArrayItem('achievements', {})}
                    onRemove={(index) => removeArrayItem('achievements', index)}
                />

                <ProjectsForm
                    projects={profile.projects}
                    onUpdate={(index, key, value) => updateArrayItem('projects', index, key, value)}
                    onAdd={() => addArrayItem('projects', { technologies: [] })}
                    onRemove={(index) => removeArrayItem('projects', index)}
                />

                <ResumeUpload
                    hasResume={hasResume}
                    resumeFile={resumeFile}
                    onSelectFile={setResumeFile}
                    onDelete={handleDeleteResume}
                    pViewResume={handleViewResume}
                    onReupload={handleReuploadResume}
                />

                <div className="flex justify-end gap-3 mb-6 bg-white p-4 rounded-lg shadow-sm sticky bottom-0 z-10 border border-neutral-100">
                    <Button variant="secondary" onClick={() => window.location.reload()}>Cancel</Button>
                    <Button onClick={handleSave} loading={saving} disabled={saving}>Save Profile</Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
