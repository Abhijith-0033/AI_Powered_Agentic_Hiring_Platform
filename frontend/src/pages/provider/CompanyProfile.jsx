import { Building2, Camera, Globe, MapPin } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Input, Select, Textarea } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
// Default empty company state since backend profile API doesn't exist yet
const defaultCompany = {
    name: "TechCorp Inc.",
    logo: "https://ui-avatars.com/api/?name=TC&background=0D8ABC&color=fff",
    website: "https://techcorp.com",
    industry: "Technology",
    size: "1000+",
    location: "San Francisco, CA",
    founded: 2010,
    description: "Leading the way in AI innovation.",
    culture: ["Innovation", "Collaboration", "Diversity"],
    benefits: ["Remote Work", "Health Insurance", "Stock Options"],
    openPositions: 0,
    totalEmployees: 1200
};

/**
 * Company Profile page
 * Manage company information and branding
 */
const CompanyProfile = () => {
    const [company, setCompany] = useState(defaultCompany);

    const sizeOptions = [
        { value: '1-10', label: '1-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '201-500', label: '201-500 employees' },
        { value: '501-1000', label: '501-1000 employees' },
        { value: '1000+', label: '1000+ employees' },
    ];

    const industryOptions = [
        { value: 'technology', label: 'Technology' },
        { value: 'finance', label: 'Finance' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'retail', label: 'Retail' },
        { value: 'manufacturing', label: 'Manufacturing' },
    ];

    return (
        <DashboardLayout type="provider" title="Company Profile">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Company Profile
                    </h2>
                    <p className="text-dark-400">
                        Manage your company information and employer branding.
                    </p>
                </div>

                {/* Company Logo */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Company Logo</CardTitle>
                        <CardDescription>
                            Upload your company logo to display on job listings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="w-24 h-24 rounded-xl object-cover border-2 border-dark-600"
                                />
                                <button className="absolute inset-0 flex items-center justify-center bg-dark-900/80 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                                    <Camera className="w-6 h-6 text-dark-100" />
                                </button>
                            </div>
                            <div>
                                <p className="text-dark-200 font-medium mb-2">Upload new logo</p>
                                <p className="text-sm text-dark-500 mb-3">PNG, JPG up to 2MB. Recommended: 256x256px</p>
                                <Button variant="secondary" size="sm">
                                    Change Logo
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
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Company Name"
                                defaultValue={company.name}
                                leftIcon={<Building2 className="w-4 h-4" />}
                            />
                            <Input
                                label="Website"
                                defaultValue={company.website}
                                leftIcon={<Globe className="w-4 h-4" />}
                            />
                            <Select
                                label="Industry"
                                options={industryOptions}
                                defaultValue="technology"
                            />
                            <Select
                                label="Company Size"
                                options={sizeOptions}
                                defaultValue="1000+"
                            />
                            <Input
                                label="Location"
                                defaultValue={company.location}
                                leftIcon={<MapPin className="w-4 h-4" />}
                            />
                            <Input
                                label="Founded"
                                type="number"
                                defaultValue={company.founded}
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Company Description"
                                defaultValue={company.description}
                                rows={6}
                                hint="Tell candidates about your company culture and mission"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Culture & Benefits */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Culture & Benefits</CardTitle>
                        <CardDescription>
                            Highlight what makes your company a great place to work
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-dark-200 mb-3">
                                Company Culture
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {company.culture.map((value) => (
                                    <Badge key={value} variant="primary">
                                        {value}
                                    </Badge>
                                ))}
                                <Button variant="outline" size="sm" className="px-3">
                                    + Add
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-200 mb-3">
                                Benefits & Perks
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {company.benefits.map((benefit) => (
                                    <Badge key={benefit} variant="success">
                                        {benefit}
                                    </Badge>
                                ))}
                                <Button variant="outline" size="sm" className="px-3">
                                    + Add
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Company Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-dark-700/30 rounded-lg">
                                <p className="text-2xl font-bold text-primary-400">{company.openPositions}</p>
                                <p className="text-sm text-dark-400">Open Positions</p>
                            </div>
                            <div className="text-center p-4 bg-dark-700/30 rounded-lg">
                                <p className="text-2xl font-bold text-secondary-400">{company.totalEmployees}</p>
                                <p className="text-sm text-dark-400">Employees</p>
                            </div>
                            <div className="text-center p-4 bg-dark-700/30 rounded-lg">
                                <p className="text-2xl font-bold text-emerald-400">{new Date().getFullYear() - company.founded}</p>
                                <p className="text-sm text-dark-400">Years in Business</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <Button variant="secondary">Cancel</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CompanyProfile;
