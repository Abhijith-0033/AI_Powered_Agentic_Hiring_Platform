import { Github, Linkedin, Mail, MapPin, Phone, Plus, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button, FileUpload, Input, Textarea, Toggle } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getUserProfile, updateUserProfile } from '../../api/users';
import AddEducationModal from '../../components/profile/AddEducationModal';
import AddExperienceModal from '../../components/profile/AddExperienceModal';

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // In a real app we'd get email from auth context.
                // For now we just load what we can.
                // Assuming getUserProfile handles logic or we skip if no email.
                // We will just stop loading for now as we are focusing on SAVE.
                setLoading(false);
            } catch (error) {
                console.error(error);
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
            let resumeBase64 = null;
            if (resumeFile) {
                resumeBase64 = await toBase64(resumeFile);
            }

            // Strict Payload Mapping
            const payload = {
                personal_info: {
                    name: profile.name,
                    email: profile.email,
                    phone_number: profile.phone,
                    location: profile.location,
                    github_url: profile.github,
                    linkedin_url: profile.linkedin,
                    resume_pdf: resumeBase64, // Base64 string
                    resume_url: profile.resumeUrl,
                    is_fresher: profile.isFresher,
                    experience_years: profile.isFresher ? 0 : parseInt(profile.experienceYears || 0),
                    skills: profile.skills.map(s => s.name),
                    profile_description: profile.about
                },
                experience: profile.experience.map(e => ({
                    job_title: e.title,
                    company_name: e.company,
                    location: e.location,
                    start_date: e.startDate,
                    end_date: e.endDate,
                    is_current: e.current,
                    description: e.description
                })),
                education: profile.education.map(e => ({
                    degree: e.degree,
                    institution: e.school,
                    graduation_year: parseInt(e.year),
                    gpa: parseFloat(e.gpa)
                }))
            };

            await updateUserProfile(payload);
            console.log('Profile saved successfully');
            alert('Profile saved successfully!'); // Temporary feedback
        } catch (error) {
            console.error('Failed to save', error);
            alert('Failed to save profile: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleEducationAdded = () => {
        window.location.reload();
    };

    const handleExperienceAdded = () => {
        window.location.reload();
    };

    if (loading) {
        return (
            <DashboardLayout type="user" title="Profile">
                <div className="text-center py-12">Loading profile...</div>
            </DashboardLayout>
        );
    }

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
                                        enabled={profile.isFresher}
                                        setEnabled={(val) => setProfile({ ...profile, isFresher: val })}
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
                            <Button onClick={handleAddSkill} leftIcon={<Plus className="w-4 h-4" />}>
                                Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3 mb-6">
                    <Button variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} loading={saving} disabled={saving}>Save Profile</Button>
                </div>

                {/* Experience */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Experience</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Plus className="w-4 h-4" />}
                                onClick={() => setIsExperienceModalOpen(true)}
                            >
                                Add Experience
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.experience && profile.experience.map((exp) => (
                                <div
                                    key={exp.id || Math.random()}
                                    className="p-4 bg-dark-700/30 rounded-lg border border-dark-700"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-dark-100">{exp.title}</h4>
                                            <p className="text-sm text-dark-400">{exp.company} • {exp.location}</p>
                                        </div>
                                        {exp.current && (
                                            <Badge variant="success" size="sm">Current</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-dark-500 mb-2">
                                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                    </p>
                                    <p className="text-sm text-dark-300">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Education */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Education</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Plus className="w-4 h-4" />}
                                onClick={() => setIsEducationModalOpen(true)}
                            >
                                Add Education
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.education && profile.education.map((edu) => (
                                <div
                                    key={edu.id || Math.random()}
                                    className="p-4 bg-dark-700/30 rounded-lg border border-dark-700"
                                >
                                    <h4 className="font-semibold text-dark-100">{edu.degree}</h4>
                                    <p className="text-sm text-dark-400">{edu.school}</p>
                                    <p className="text-xs text-dark-500 mt-1">
                                        {edu.year} • GPA: {edu.gpa}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Resume Upload */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Resume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload
                            accept=".pdf,.doc,.docx"
                            hint="PDF or DOC up to 10MB"
                            onFileSelect={(file) => setResumeFile(file)}
                        />
                        {profile.resumeUrl && (
                            <p className="text-sm text-dark-400 mt-3">
                                Last updated: {profile.resumeLastUpdated}
                            </p>
                        )}
                    </CardContent>
                </Card>



                <AddEducationModal
                    isOpen={isEducationModalOpen}
                    onClose={() => setIsEducationModalOpen(false)}
                    onSuccess={handleEducationAdded}
                />

                <AddExperienceModal
                    isOpen={isExperienceModalOpen}
                    onClose={() => setIsExperienceModalOpen(false)}
                    onSuccess={handleExperienceAdded}
                />
            </div>
        </DashboardLayout>
    );
};

export default Profile;
