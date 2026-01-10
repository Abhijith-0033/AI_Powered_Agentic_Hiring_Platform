import { Check, Download, Eye, FileText, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, FileUpload } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * Resume Tools page
 * Upload, generate, preview, and download resumes
 */
const ResumeTools = () => {
    const resumeVersions = [
        {
            id: 1,
            name: 'General Resume',
            lastUpdated: '2024-01-15',
            score: 92,
            status: 'active',
        },
        {
            id: 2,
            name: 'Frontend Developer Resume',
            lastUpdated: '2024-01-10',
            score: 88,
            targetJob: 'Senior Frontend Developer',
        },
        {
            id: 3,
            name: 'Full Stack Resume',
            lastUpdated: '2024-01-05',
            score: 85,
            targetJob: 'Full Stack Engineer',
        },
    ];

    return (
        <DashboardLayout type="user" title="Resume Tools">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Resume Management
                    </h2>
                    <p className="text-dark-400">
                        Upload, optimize, and manage your resumes with AI assistance.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card hover className="cursor-pointer group">
                        <CardContent className="text-center py-8">
                            <div className="p-4 rounded-xl bg-primary-500/20 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-primary-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-2">Upload Resume</h3>
                            <p className="text-sm text-dark-400">Upload your existing resume for analysis</p>
                        </CardContent>
                    </Card>

                    <Card hover className="cursor-pointer group">
                        <CardContent className="text-center py-8">
                            <div className="p-4 rounded-xl bg-secondary-500/20 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-8 h-8 text-secondary-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-2">Generate Resume</h3>
                            <p className="text-sm text-dark-400">Create an AI-optimized resume</p>
                        </CardContent>
                    </Card>

                    <Card hover className="cursor-pointer group">
                        <CardContent className="text-center py-8">
                            <div className="p-4 rounded-xl bg-emerald-500/20 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <RefreshCw className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-2">Optimize Resume</h3>
                            <p className="text-sm text-dark-400">Improve your resume for specific jobs</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload New Resume</CardTitle>
                            <CardDescription>
                                Upload your resume and get AI-powered feedback
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FileUpload
                                accept=".pdf,.doc,.docx"
                                hint="PDF or DOC up to 10MB"
                            />
                            <div className="mt-4 p-4 bg-dark-700/30 rounded-lg border border-dark-700">
                                <h4 className="text-sm font-medium text-dark-200 mb-2">After Upload:</h4>
                                <ul className="space-y-2 text-sm text-dark-400">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        AI parses your resume structure
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        Skills and experience extracted
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        ATS compatibility score calculated
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resume Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resume Preview</CardTitle>
                            <CardDescription>
                                Preview your current active resume
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-[8.5/11] bg-dark-700/50 rounded-lg border border-dark-600 flex items-center justify-center mb-4">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                                    <p className="text-dark-400">Resume preview will appear here</p>
                                    <p className="text-sm text-dark-500 mt-1">Upload a resume to preview</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" fullWidth leftIcon={<Eye className="w-4 h-4" />}>
                                    Full Preview
                                </Button>
                                <Button variant="primary" fullWidth leftIcon={<Download className="w-4 h-4" />}>
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Resume Versions */}
                <Card className="mt-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Resume Versions</CardTitle>
                            <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                                Generate New Version
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {resumeVersions.map((resume) => (
                                <div
                                    key={resume.id}
                                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-dark-600 rounded-lg">
                                            <FileText className="w-5 h-5 text-dark-300" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-dark-100">{resume.name}</h4>
                                                {resume.status === 'active' && (
                                                    <Badge variant="success" size="sm">Active</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-dark-500">
                                                Updated {resume.lastUpdated}
                                                {resume.targetJob && ` • Optimized for ${resume.targetJob}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-primary-400">{resume.score}%</div>
                                            <p className="text-xs text-dark-500">ATS Score</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Download className="w-4 h-4" />
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

export default ResumeTools;
