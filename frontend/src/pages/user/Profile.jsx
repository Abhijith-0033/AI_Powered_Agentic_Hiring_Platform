import { Github, Linkedin, Mail, MapPin, Phone, Plus, User, X } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button, FileUpload, Input, Textarea } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { userProfile } from '../../mockData/users';

/**
 * User Profile page
 * Profile form with skills, experience, education management
 */
const Profile = () => {
    const [profile, setProfile] = useState(userProfile);
    const [newSkill, setNewSkill] = useState('');

    const experienceLevels = [
        { value: 'entry', label: 'Entry Level (0-2 years)' },
        { value: 'mid', label: 'Mid Level (3-5 years)' },
        { value: 'senior', label: 'Senior (6-10 years)' },
        { value: 'lead', label: 'Lead/Staff (10+ years)' },
    ];

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, { name: newSkill.trim(), level: 'Intermediate', years: 1 }]
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
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="w-24 h-24 rounded-xl object-cover"
                                />
                                <button className="absolute inset-0 flex items-center justify-center bg-dark-900/80 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                                    <User className="w-6 h-6 text-dark-100" />
                                </button>
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-dark-100 mb-1">{profile.name}</h2>
                                <p className="text-dark-400 mb-3">{profile.title}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-dark-400">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {profile.email}
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
                                defaultValue={profile.name}
                                leftIcon={<User className="w-4 h-4" />}
                            />
                            <Input
                                label="Email"
                                type="email"
                                defaultValue={profile.email}
                                leftIcon={<Mail className="w-4 h-4" />}
                            />
                            <Input
                                label="Phone"
                                defaultValue={profile.phone}
                                leftIcon={<Phone className="w-4 h-4" />}
                            />
                            <Input
                                label="Location"
                                defaultValue={profile.location}
                                leftIcon={<MapPin className="w-4 h-4" />}
                            />
                            <Input
                                label="LinkedIn"
                                defaultValue={profile.linkedin}
                                leftIcon={<Linkedin className="w-4 h-4" />}
                            />
                            <Input
                                label="GitHub"
                                defaultValue={profile.github}
                                leftIcon={<Github className="w-4 h-4" />}
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="About"
                                defaultValue={profile.about}
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
                            {profile.skills.map((skill) => (
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

                {/* Experience */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Experience</CardTitle>
                            <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                                Add Experience
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.experience.map((exp) => (
                                <div
                                    key={exp.id}
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
                            <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                                Add Education
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.education.map((edu) => (
                                <div
                                    key={edu.id}
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
                        />
                        {profile.resumeUrl && (
                            <p className="text-sm text-dark-400 mt-3">
                                Last updated: {profile.resumeLastUpdated}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <Button variant="secondary">Cancel</Button>
                    <Button>Save Profile</Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
