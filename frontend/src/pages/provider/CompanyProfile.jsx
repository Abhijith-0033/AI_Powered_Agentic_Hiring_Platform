import { Building2, Camera, Globe, MapPin, Linkedin, Twitter } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button, Input, Textarea } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const CompanyProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website_url: '',
        location: '',
        description: '',
        linkedin_url: '',
        twitter_url: ''
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        fetchCompanyProfile();
    }, []);

    const fetchCompanyProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/companies/mine');
            if (response.data.company) {
                const { name, industry, website_url, location, description, linkedin_url, twitter_url, logo } = response.data.company;
                setFormData({
                    name: name || '',
                    industry: industry || '',
                    website_url: website_url || '',
                    location: location || '',
                    description: description || '',
                    linkedin_url: linkedin_url || '',
                    twitter_url: twitter_url || ''
                });
                if (logo) {
                    setLogoPreview(logo);
                }
            }
        } catch (error) {
            console.error('Error fetching company profile:', error);
            setMessage({ type: 'error', text: 'Failed to load company profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit check on frontend too
                setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!formData.name) {
            setMessage({ type: 'error', text: 'Company Name is required' });
            return;
        }

        try {
            setSaving(true);
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });

            if (logoFile) {
                data.append('logo', logoFile);
            }

            // Using POST for both create and update as implemented in backend to handle upsert/logic
            const response = await api.post('/companies', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Company profile saved successfully' });
                // Update local state with returned data to sync
                const updatedCompany = response.data.company;
                setFormData({
                    name: updatedCompany.name,
                    industry: updatedCompany.industry || '',
                    website_url: updatedCompany.website_url || '',
                    location: updatedCompany.location || '',
                    description: updatedCompany.description || '',
                    linkedin_url: updatedCompany.linkedin_url || '',
                    twitter_url: updatedCompany.twitter_url || ''
                });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save profile';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout type="provider">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="provider" title="Company Profile">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Company Profile
                    </h2>
                    <p className="text-dark-400">
                        Manage your company information and employer branding.
                    </p>
                </div>

                {message.text && (
                    <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Company Logo */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Company Logo</CardTitle>
                            <CardDescription>
                                Upload your company logo. Displayed on job listings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-xl border-2 border-dark-600 overflow-hidden bg-dark-800 flex items-center justify-center">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 className="w-10 h-10 text-dark-400" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex items-center justify-center bg-dark-900/80 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity cursor-pointer"
                                    >
                                        <Camera className="w-6 h-6 text-dark-100" />
                                    </button>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleLogoChange}
                                    />
                                    <p className="text-dark-200 font-medium mb-2">Upload new logo</p>
                                    <p className="text-sm text-dark-500 mb-3">PNG, JPG up to 5MB.</p>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Select Image
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Information */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Input
                                    label="Company Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corp"
                                    required
                                    leftIcon={<Building2 className="w-4 h-4" />}
                                />

                                <Input
                                    label="Company Email"
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-dark-800/50 text-dark-400 cursor-not-allowed" // Visual indication of read-only
                                    hint="Your registered email is used for company verification"
                                />

                                <Input
                                    label="Industry"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Technology, Healthcare"
                                />

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input
                                        label="Website URL"
                                        name="website_url"
                                        value={formData.website_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com"
                                        leftIcon={<Globe className="w-4 h-4" />}
                                    />
                                    <Input
                                        label="Location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="City, Country"
                                        leftIcon={<MapPin className="w-4 h-4" />}
                                    />
                                </div>

                                <Textarea
                                    label="Company Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    placeholder="Tell candidates about your company..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Profiles */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Social Profiles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="LinkedIn URL"
                                    name="linkedin_url"
                                    value={formData.linkedin_url}
                                    onChange={handleInputChange}
                                    placeholder="https://linkedin.com/company/..."
                                    leftIcon={<Linkedin className="w-4 h-4" />}
                                />
                                <Input
                                    label="Twitter URL"
                                    name="twitter_url"
                                    value={formData.twitter_url}
                                    onChange={handleInputChange}
                                    placeholder="https://twitter.com/..."
                                    leftIcon={<Twitter className="w-4 h-4" />}
                                />
                            </div>
                        </CardContent>
                    </Card>


                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mb-8">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={saving}
                            disabled={saving}
                        >
                            Save Profile
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default CompanyProfile;
