import { Camera, Github, Linkedin, Mail, MapPin, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Input, Textarea, Toggle } from '../ui';

const PersonalInfoForm = ({ profile, setProfile, profileImage, handleImageUpload, isUploadingImage }) => {

    const handleFresherToggle = (value) => {
        setProfile(prev => ({ ...prev, isFresher: value }));
        // Note: The parent component should handle the API call for fresher status update if needed immediately, 
        // or just save it on "Save Profile". 
        // In Profile.jsx, it called API immediately. 
        // For the modal, we might want to defer it? 
        // The original Profile.jsx allows immediate toggle. 
        // We will just update state here. The parent can trigger side effects if needed.
    };

    return (
        <div className="space-y-6">
            {/* Header / Avatar */}
            <Card>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="relative group">
                            <img
                                src={profileImage || profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}`}
                                alt={profile.name}
                                className="w-24 h-24 rounded-xl object-cover shadow-sm border border-neutral-100"
                            />
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => handleImageUpload(e.target.files[0])}
                                />
                                <div className="text-white p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                    <Camera className="w-6 h-6" />
                                </div>
                            </label>
                            {isUploadingImage && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-neutral-900 mb-1">{profile.name || 'Your Name'}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location || 'Location'}</span>
                                <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{profile.email}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Info Inputs */}
            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Full Name" value={profile.name} onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))} leftIcon={<User className="w-4 h-4" />} />
                        <Input label="Phone" value={profile.phone} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} leftIcon={<Phone className="w-4 h-4" />} />
                        <Input label="Location" value={profile.location} onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))} leftIcon={<MapPin className="w-4 h-4" />} />
                        <Input label="LinkedIn" value={profile.linkedin} onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))} leftIcon={<Linkedin className="w-4 h-4" />} />
                        <Input label="GitHub" value={profile.github} onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))} leftIcon={<Github className="w-4 h-4" />} />

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-700">Experience Level</label>
                            <div className="flex items-center gap-2 h-10">
                                <Toggle checked={profile.isFresher} onChange={handleFresherToggle} />
                                <span className="text-neutral-600">I am a Fresher</span>
                            </div>
                        </div>

                        {!profile.isFresher && (
                            <Input label="Years of Experience" type="number" value={profile.experienceYears} onChange={(e) => setProfile(prev => ({ ...prev, experienceYears: e.target.value }))} min="0" />
                        )}
                    </div>
                    <div className="mt-4">
                        <Textarea label="About" value={profile.about} onChange={(e) => setProfile(prev => ({ ...prev, about: e.target.value }))} rows={4} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PersonalInfoForm;
