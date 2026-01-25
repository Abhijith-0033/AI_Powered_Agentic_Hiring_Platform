import { Eye, Github, Linkedin, Mail, MapPin, Phone, Upload, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button, FileUpload, Input, Textarea, Toggle } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getUserProfile, updateUserProfile, updateFresherStatus, getProfileResume, uploadResume } from '../../api/users';

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

/**
 * User Profile page
 * Profile form with skills, experience, education management
 */
const Profile = () => {
    const [profile, setProfile] = useState({
        name: '', title: '', email: '', phone: '', location: '',
        linkedin: '', github: '', about: '',
        avatar: '',
        skills: [], experience: [], education: [],
        profileCompletion: 0,
        isFresher: true,
        experienceYears: 0,
        resumeUrl: ''
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [hasResume, setHasResume] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [error, setError] = useState(null);
    const [isReupload, setIsReupload] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                console.log('[Profile] Starting profile fetch...');
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('[Profile] No token found');
                    setLoading(false);
                    return;
                }

                console.log('[Profile] Calling getUserProfile API...');
                const data = await getUserProfile();
                console.log('[Profile] API Response:', data);

                if (data && data.data) {
                    const profileData = data.data;
                    console.log('[Profile] Profile data received:', profileData);

                    // Map backend response to frontend state
                    const mappedProfile = {
                        name: profileData.name || '',
                        title: '', // Not in backend schema yet
                        email: profileData.email || '',
                        phone: profileData.phone_number || '',
                        location: profileData.location || '',
                        linkedin: profileData.linkedin_url || '',
                        github: profileData.github_url || '',
                        about: profileData.profile_description || '',
                        avatar: '', // Not implemented yet
                        skills: (profileData.skills || []).map(s => ({ name: s, level: 'Intermediate', years: 1 })),
                        experience: (profileData.experience || []).map(exp => ({
                            id: exp.id,
                            title: exp.job_title,
                            company: exp.company_name,
                            location: exp.location,
                            startDate: exp.start_date,
                            endDate: exp.end_date,
                            current: exp.is_current,
                            description: exp.description
                        })),
                        education: (profileData.education || []).map(edu => ({
                            id: edu.id,
                            degree: edu.degree,
                            school: edu.institution,
                            year: edu.graduation_year,
                            gpa: edu.gpa
                        })),
                        profileCompletion: 0, // Calculate based on filled fields
                        isFresher: profileData.is_fresher !== undefined ? profileData.is_fresher : true,
                        experienceYears: profileData.experience_years || 0,
                        resumeUrl: profileData.resume_pdf || '' // Use 'resume_pdf' column (BYTEA)
                    };

                    console.log('[Profile] Mapped profile:', mappedProfile);
                    setProfile(mappedProfile);

                    // Check if resume exists (use resume_pdf BYTEA column)
                    if (profileData.resume_pdf) {
                        setHasResume(true);
                        console.log('[Profile] Resume exists in database');
                    } else {
                        setHasResume(false);
                        console.log('[Profile] No resume in database');
                    }
                } else {
                    console.warn('[Profile] No data in API response');
                    setError('No profile data received');
                }
            } catch (error) {
                console.error('[Profile] Failed to fetch profile:', error);
                console.error('[Profile] Error details:', error.response?.data || error.message);
                setError(error.message || 'Failed to load profile');
            } finally {
                console.log('[Profile] Setting loading to false');
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setProfile(prev => ({
                ...prev,
                skills: [...(prev.skills || []), { name: newSkill.trim(), level: 'Intermediate', years: 1 }]
            }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillName) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s.name !== skillName)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            console.log('[Profile Save] Starting save...', profile);

            // Strict Payload Mapping (WITHOUT resume_pdf - handled separately)
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
                experience: (profile.experience || []).filter(e => e && (e.title || e.company)).map(e => ({
                    job_title: e.title,
                    company_name: e.company,
                    location: e.location,
                    start_date: e.startDate,
                    end_date: e.endDate,
                    is_current: e.current,
                    description: e.description
                })),
                education: (profile.education || []).filter(e => e && (e.degree || e.school)).map(e => ({
                    degree: e.degree,
                    institution: e.school,
                    graduation_year: e.year ? parseInt(e.year) : null,
                    gpa: e.gpa ? parseFloat(e.gpa) : null
                }))
            };

            console.log('[Profile Save] Payload:', payload);

            // Save profile first
            await updateUserProfile(payload);
            console.log('[Profile Save] Profile data saved successfully!');

            // Upload resume separately ONLY if a new file was selected (syncs with both tables)
            if (resumeFile && resumeFile instanceof File) {
                console.log('[Profile] Uploading new resume from profile...', resumeFile.name);
                try {
                    await uploadResume(resumeFile, { syncProfile: true }); // Sync with profile
                    setHasResume(true);
                    setResumeFile(null);
                    console.log('[Profile] Resume uploaded and synced successfully!');
                } catch (resumeError) {
                    console.error('[Profile] Resume upload failed:', resumeError);
                    // Don't fail the entire save if resume upload fails
                    alert('Profile saved, but resume upload failed: ' + (resumeError.response?.data?.message || resumeError.message));
                    setSaving(false);
                    return;
                }
            }

            alert('Profile saved successfully!');
        } catch (error) {
            console.error('[Profile Save] Failed:', error);
            console.error('[Profile Save] Error response:', error.response?.data);
            alert('Failed to save profile: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleFresherToggle = async (value) => {
        // Optimistically update UI
        setProfile({ ...profile, isFresher: value });

        try {
            await updateFresherStatus(value);
            console.log(`Fresher status updated to: ${value}`);
        } catch (error) {
            console.error('Failed to update fresher status:', error);
            // Revert on error
            setProfile({ ...profile, isFresher: !value });
            alert('Failed to update fresher status: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleViewResume = async () => {
        try {
            console.log('[Profile] Fetching profile resume for view...');
            const blob = await getProfileResume(); // Use dedicated Profile resume endpoint
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            console.log('[Profile] Resume opened in new tab');
        } catch (error) {
            console.error('[Profile] Failed to load resume:', error);
            if (error.response?.status === 404) {
                alert('No resume found. Please upload a resume first.');
            } else {
                alert('Failed to load resume: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleReuploadResume = async (file) => {
        if (!file) return;

        setSaving(true);
        try {
            console.log('[Profile] Re-uploading resume...', file.name);
            await uploadResume(file, { syncProfile: true }); // Sync with profile
            setHasResume(true);
            setResumeFile(null);
            alert('Resume re-uploaded successfully!');
            console.log('[Profile] Resume re-upload successful');
        } catch (error) {
            console.error('[Profile] Failed to re-upload resume:', error);
            alert('Failed to re-upload resume: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteResume = async () => {
        const confirmed = window.confirm('Are you sure you want to delete your resume? This action cannot be undone.');
        if (!confirmed) return;

        setSaving(true);
        try {
            console.log('[Profile] Deleting profile resume...');

            // Call backend to set candidates.resume_pdf = NULL
            await updateUserProfile({
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
                    profile_description: profile.about,
                    resume_pdf: null // Set to NULL to delete (BYTEA column)
                },
                experience: (profile.experience || []).filter(e => e && (e.title || e.company)).map(e => ({
                    job_title: e.title,
                    company_name: e.company,
                    location: e.location,
                    start_date: e.startDate,
                    end_date: e.endDate,
                    is_current: e.current,
                    description: e.description
                })),
                education: (profile.education || []).filter(e => e && (e.degree || e.school)).map(e => ({
                    degree: e.degree,
                    institution: e.school,
                    graduation_year: e.year ? parseInt(e.year) : null,
                    gpa: e.gpa ? parseFloat(e.gpa) : null
                }))
            });

            setHasResume(false);
            setProfile({ ...profile, resumeUrl: '' });
            alert('Resume deleted successfully!');
            console.log('[Profile] Resume deleted from profile');
        } catch (error) {
            console.error('[Profile] Failed to delete resume:', error);
            alert('Failed to delete resume: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        console.log('[Profile] Rendering loading state');
        return (
            <DashboardLayout type="user" title="Profile">
                <div className="max-w-4xl mx-auto">
                    <Card className="mb-6">
                        <CardContent>
                            <div className="text-center py-12">
                                <p className="text-lg text-dark-300">Loading profile...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        console.log('[Profile] Rendering error state:', error);
        return (
            <DashboardLayout type="user" title="Profile">
                <div className="max-w-4xl mx-auto">
                    <Card className="mb-6">
                        <CardContent>
                            <div className="text-center py-12">
                                <p className="text-lg text-red-400 mb-4">Failed to load profile</p>
                                <p className="text-sm text-dark-400">{error}</p>
                                <Button
                                    className="mt-4"
                                    onClick={() => window.location.reload()}
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    console.log('[Profile] Rendering profile form');
    return (
        <DashboardLayout type="user" title="Profile">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <Card className="mb-6">
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <img
                                    src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}`}
                                    alt={profile.name}
                                    className="w-24 h-24 rounded-xl object-cover"
                                />
                                <button className="absolute inset-0 flex items-center justify-center bg-dark-900/80 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                                    <User className="w-6 h-6 text-dark-100" />
                                </button>
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-dark-100 mb-1">{profile.name || 'Your Name'}</h2>
                                <p className="text-dark-400 mb-3">{profile.title || 'Job Title'}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-dark-400">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.location || 'Location'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {profile.email || 'email@example.com'}
                                    </span>
                                </div>
                            </div>

                            {/* Completion Score */}
                            <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                                <div className="text-3xl font-bold text-primary-400 mb-1">
                                    {profile.profileCompletion}%
                                </div>
                                <p className="text-xs text-dark-400">Profile Complete</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                leftIcon={<User className="w-4 h-4" />}
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                leftIcon={<Mail className="w-4 h-4" />}
                                disabled
                            />
                            <Input
                                label="Phone"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                leftIcon={<Phone className="w-4 h-4" />}
                            />
                            <Input
                                label="Location"
                                value={profile.location}
                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                leftIcon={<MapPin className="w-4 h-4" />}
                            />
                            <Input
                                label="LinkedIn"
                                value={profile.linkedin}
                                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                leftIcon={<Linkedin className="w-4 h-4" />}
                            />
                            <Input
                                label="GitHub"
                                value={profile.github}
                                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                                leftIcon={<Github className="w-4 h-4" />}
                            />

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-dark-200">Experience Level</label>
                                <div className="flex items-center gap-2 h-10">
                                    <Toggle
                                        checked={profile.isFresher}
                                        onChange={handleFresherToggle}
                                    />
                                    <span className="text-dark-300">I am a Fresher</span>
                                </div>
                            </div>

                            {!profile.isFresher && (
                                <Input
                                    label="Years of Experience"
                                    type="number"
                                    value={profile.experienceYears}
                                    onChange={(e) => setProfile({ ...profile, experienceYears: e.target.value })}
                                    min="0"
                                />
                            )}

                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="About"
                                value={profile.about}
                                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                                rows={4}
                                hint="Write a brief introduction about yourself"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Skills */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {profile.skills && profile.skills.map((skill) => (
                                <Badge
                                    key={skill.name}
                                    variant="primary"
                                    className="flex items-center gap-1 pr-1"
                                >
                                    {skill.name}
                                    <button
                                        onClick={() => handleRemoveSkill(skill.name)}
                                        className="p-0.5 hover:bg-primary-400/20 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a skill..."
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                            />
                            <Button onClick={handleAddSkill}>
                                Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Experience */}
                {!profile.isFresher && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Job Title"
                                    value={(profile.experience && profile.experience[0]?.title) || ''}
                                    onChange={(e) => {
                                        const newExp = profile.experience ? [...profile.experience] : [];
                                        if (newExp.length === 0) newExp.push({});
                                        newExp[0] = { ...newExp[0], title: e.target.value };
                                        setProfile({ ...profile, experience: newExp });
                                    }}
                                />
                                <Input
                                    label="Company Name"
                                    value={(profile.experience && profile.experience[0]?.company) || ''}
                                    onChange={(e) => {
                                        const newExp = profile.experience ? [...profile.experience] : [];
                                        if (newExp.length === 0) newExp.push({});
                                        newExp[0] = { ...newExp[0], company: e.target.value };
                                        setProfile({ ...profile, experience: newExp });
                                    }}
                                />
                                <Input
                                    label="Location"
                                    value={(profile.experience && profile.experience[0]?.location) || ''}
                                    onChange={(e) => {
                                        const newExp = profile.experience ? [...profile.experience] : [];
                                        if (newExp.length === 0) newExp.push({});
                                        newExp[0] = { ...newExp[0], location: e.target.value };
                                        setProfile({ ...profile, experience: newExp });
                                    }}
                                />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-dark-200">Currently Working Here</label>
                                    <div className="flex items-center gap-2 h-10">
                                        <Toggle
                                            checked={(profile.experience && profile.experience[0]?.current) || false}
                                            onChange={(value) => {
                                                const newExp = profile.experience ? [...profile.experience] : [];
                                                if (newExp.length === 0) newExp.push({});
                                                newExp[0] = { ...newExp[0], current: value };
                                                setProfile({ ...profile, experience: newExp });
                                            }}
                                        />
                                        <span className="text-dark-300">Currently working here</span>
                                    </div>
                                </div>
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={(profile.experience && profile.experience[0]?.startDate) || ''}
                                    onChange={(e) => {
                                        const newExp = profile.experience ? [...profile.experience] : [];
                                        if (newExp.length === 0) newExp.push({});
                                        newExp[0] = { ...newExp[0], startDate: e.target.value };
                                        setProfile({ ...profile, experience: newExp });
                                    }}
                                />
                                {!(profile.experience && profile.experience[0]?.current) && (
                                    <Input
                                        label="End Date"
                                        type="date"
                                        value={(profile.experience && profile.experience[0]?.endDate) || ''}
                                        onChange={(e) => {
                                            const newExp = profile.experience ? [...profile.experience] : [];
                                            if (newExp.length === 0) newExp.push({});
                                            newExp[0] = { ...newExp[0], endDate: e.target.value };
                                            setProfile({ ...profile, experience: newExp });
                                        }}
                                    />
                                )}
                            </div>
                            <div className="mt-4">
                                <Textarea
                                    label="Description"
                                    value={(profile.experience && profile.experience[0]?.description) || ''}
                                    onChange={(e) => {
                                        const newExp = profile.experience ? [...profile.experience] : [];
                                        if (newExp.length === 0) newExp.push({});
                                        newExp[0] = { ...newExp[0], description: e.target.value };
                                        setProfile({ ...profile, experience: newExp });
                                    }}
                                    rows={3}
                                    hint="Describe your role and responsibilities"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Education */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Education</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Degree"
                                value={(profile.education && profile.education[0]?.degree) || ''}
                                onChange={(e) => {
                                    const newEdu = profile.education ? [...profile.education] : [];
                                    if (newEdu.length === 0) newEdu.push({});
                                    newEdu[0] = { ...newEdu[0], degree: e.target.value };
                                    setProfile({ ...profile, education: newEdu });
                                }}
                                hint="e.g., Bachelor of Science in Computer Science"
                            />
                            <Input
                                label="Institution"
                                value={(profile.education && profile.education[0]?.school) || ''}
                                onChange={(e) => {
                                    const newEdu = profile.education ? [...profile.education] : [];
                                    if (newEdu.length === 0) newEdu.push({});
                                    newEdu[0] = { ...newEdu[0], school: e.target.value };
                                    setProfile({ ...profile, education: newEdu });
                                }}
                                hint="University or College name"
                            />
                            <Input
                                label="Graduation Year"
                                type="number"
                                value={(profile.education && profile.education[0]?.year) || ''}
                                onChange={(e) => {
                                    const newEdu = profile.education ? [...profile.education] : [];
                                    if (newEdu.length === 0) newEdu.push({});
                                    newEdu[0] = { ...newEdu[0], year: e.target.value };
                                    setProfile({ ...profile, education: newEdu });
                                }}
                                min="1950"
                                max="2030"
                            />
                            <Input
                                label="GPA"
                                type="number"
                                value={(profile.education && profile.education[0]?.gpa) || ''}
                                onChange={(e) => {
                                    const newEdu = profile.education ? [...profile.education] : [];
                                    if (newEdu.length === 0) newEdu.push({});
                                    newEdu[0] = { ...newEdu[0], gpa: e.target.value };
                                    setProfile({ ...profile, education: newEdu });
                                }}
                                step="0.01"
                                min="0"
                                max="10"
                                hint="On a 10.0 scale"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Resume Upload */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Resume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hasResume ? (
                            // Resume EXISTS - Show View/Delete/Replace actions
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Resume uploaded</span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {/* View Resume Button */}
                                    <Button
                                        variant="secondary"
                                        onClick={handleViewResume}
                                        leftIcon={<Eye className="w-4 h-4" />}
                                        disabled={saving}
                                    >
                                        View Resume
                                    </Button>

                                    {/* Delete Resume Button */}
                                    <Button
                                        variant="outline"
                                        onClick={handleDeleteResume}
                                        leftIcon={<X className="w-4 h-4" />}
                                        disabled={saving}
                                    >
                                        Delete Resume
                                    </Button>

                                    {/* Upload New Resume (Replace) */}
                                    <FileUpload
                                        accept=".pdf"
                                        hint="PDF only, up to 10MB"
                                        onFileSelect={handleReuploadResume}
                                        customButton={(onClick) => (
                                            <Button
                                                variant="primary"
                                                onClick={onClick}
                                                leftIcon={<Upload className="w-4 h-4" />}
                                                disabled={saving}
                                            >
                                                Upload New Resume
                                            </Button>
                                        )}
                                    />
                                </div>
                            </div>
                        ) : (
                            // NO Resume - Show Upload Dropzone ONLY
                            <div>
                                <FileUpload
                                    accept=".pdf"
                                    hint="PDF only, up to 10MB"
                                    onFileSelect={(file) => setResumeFile(file)}
                                />
                                {resumeFile && (
                                    <p className="text-sm text-emerald-400 mt-3">
                                        {resumeFile.name} selected - Click "Save Profile" to upload
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Save and Cancel Buttons */}
                <div className="flex justify-end gap-3 mb-6">
                    <Button variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} loading={saving} disabled={saving}>Save Profile</Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
