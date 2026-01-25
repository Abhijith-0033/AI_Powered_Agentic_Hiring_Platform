import { Check, Download, Eye, FileText, RefreshCw, Sparkles, Upload, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, FileUpload } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { fetchResume, uploadResume, getAllResumes, deleteResume } from '../../api/users';

/**
 * Resume Tools page
 * Upload, manage, preview, and download multiple resumes (max 5)
 */
const ResumeTools = () => {
    // Resume list state
    const [resumes, setResumes] = useState([]);
    const [resumeCount, setResumeCount] = useState(0);
    const [activeResumeId, setActiveResumeId] = useState(null);

    // Preview state
    const [resumeBlob, setResumeBlob] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [loadingResumes, setLoadingResumes] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Load resumes list on mount
    useEffect(() => {
        loadResumesList();
    }, []);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Load all resumes for the user
    const loadResumesList = async () => {
        setLoadingResumes(true);
        try {
            console.log('[ResumeTools] Fetching resumes list...');
            const response = await getAllResumes();
            const resumesList = response.data || [];

            setResumes(resumesList);
            setResumeCount(resumesList.length);
            console.log(`[ResumeTools] Loaded ${resumesList.length} resumes`);

            // Auto-load default or most recent resume
            if (resumesList.length > 0) {
                const defaultResume = resumesList.find(r => r.is_default) || resumesList[0];
                await loadResume(defaultResume.id);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('[ResumeTools] Error loading resumes list:', err);
            setError('Failed to load resumes');
            setLoading(false);
        } finally {
            setLoadingResumes(false);
        }
    };

    // Load specific resume for preview
    const loadResume = async (resumeId) => {
        setLoading(true);
        setActiveResumeId(resumeId);
        try {
            console.log(`[ResumeTools] Fetching resume ${resumeId}...`);
            const blob = await fetchResume(resumeId);
            setResumeBlob(blob);

            // Revoke old preview URL before creating new one
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            // Create preview URL
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);

            console.log('[ResumeTools] Resume loaded successfully');
            setError(null);
        } catch (err) {
            console.error('[ResumeTools] Load error:', err);
            setError('Failed to load resume');
        } finally {
            setLoading(false);
        }
    };

    // Handle resume upload
    const handleUpload = async (file) => {
        if (!file) return;

        // Check if max limit reached
        if (resumeCount >= 5) {
            alert('You can upload a maximum of 5 resumes. Please delete an existing resume before uploading a new one.');
            return;
        }

        setUploading(true);
        try {
            console.log('[ResumeTools] Uploading resume:', file.name);
            await uploadResume(file);

            // Reload resumes list
            await loadResumesList();

            alert('Resume uploaded successfully!');
            console.log('[ResumeTools] Upload successful');
        } catch (err) {
            console.error('[ResumeTools] Upload error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to upload resume';
            alert(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    // Handle resume deletion
    const handleDelete = async (resumeId, resumeName) => {
        if (!confirm(`Are you sure you want to delete "${resumeName}"?`)) {
            return;
        }

        try {
            console.log(`[ResumeTools] Deleting resume ${resumeId}...`);
            await deleteResume(resumeId);

            // Reload resumes list
            await loadResumesList();

            alert('Resume deleted successfully!');
        } catch (err) {
            console.error('[ResumeTools] Delete error:', err);
            alert('Failed to delete resume: ' + (err.response?.data?.message || err.message));
        }
    };

    // Handle resume click in list
    const handleResumeClick = (resumeId) => {
        if (resumeId !== activeResumeId) {
            loadResume(resumeId);
        }
    };

    const handleViewFullScreen = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    const handleDownload = () => {
        if (resumeBlob && activeResumeId) {
            const activeResume = resumes.find(r => r.id === activeResumeId);
            const fileName = activeResume?.resume_name || 'resume.pdf';

            const url = URL.createObjectURL(resumeBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const hasResume = resumeCount > 0 && activeResumeId !== null;
    const canUpload = resumeCount < 5 && !uploading;

    return (
        <DashboardLayout type="user" title="Resume Tools">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Resume Management
                    </h2>
                    <p className="text-dark-400">
                        Upload, optimize, and manage your resumes with AI assistance. ({resumeCount}/5 resumes)
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card hover className="cursor-not-allowed group opacity-50">
                        <CardContent className="text-center py-8">
                            <div className="p-4 rounded-xl bg-secondary-500/20 w-fit mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-secondary-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-2">Generate Resume</h3>
                            <p className="text-sm text-dark-400">Create an AI-optimized resume (Coming Soon)</p>
                        </CardContent>
                    </Card>

                    <Card hover className="cursor-not-allowed group opacity-50">
                        <CardContent className="text-center py-8">
                            <div className="p-4 rounded-xl bg-emerald-500/20 w-fit mx-auto mb-4">
                                <RefreshCw className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-2">Optimize Resume</h3>
                            <p className="text-sm text-dark-400">Improve your resume for specific jobs (Coming Soon)</p>
                        </CardContent>
                    </Card>

                    <Card hover className="cursor-pointer group">
                        <CardContent className="text-center py-8">
                            <div className="p-4 rounded-xl bg-primary-500/20 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-primary-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-100 mb-2">Upload Resume</h3>
                            <p className="text-sm text-dark-400">Upload your existing resume for analysis</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload New Resume</CardTitle>
                            <CardDescription>
                                {canUpload
                                    ? `Upload your resume (${resumeCount}/5 slots used)`
                                    : 'Maximum resume limit reached (5/5)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FileUpload
                                accept=".pdf"
                                hint={canUpload ? "PDF only, up to 10MB" : "Delete a resume to upload more"}
                                onFileSelect={handleUpload}
                                disabled={!canUpload}
                            />

                            {!canUpload && resumeCount >= 5 && (
                                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                    <p className="text-sm text-amber-400 font-medium">
                                        ⚠️ You can upload a maximum of 5 resumes.
                                    </p>
                                    <p className="text-xs text-amber-400/80 mt-1">
                                        Delete an existing resume to upload a new one.
                                    </p>
                                </div>
                            )}

                            {canUpload && (
                                <div className="mt-4 p-4 bg-dark-700/30 rounded-lg border border-dark-700">
                                    <h4 className="text-sm font-medium text-dark-200 mb-2">After Upload:</h4>
                                    <ul className="space-y-2 text-sm text-dark-400">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            Resume saved to your profile
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            Instantly preview your resume
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            Ready for job applications
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resume Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resume Preview</CardTitle>
                            <CardDescription>
                                {hasResume ? 'Preview your selected resume' : 'No resume selected'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="aspect-[8.5/11] bg-dark-700/50 rounded-lg border border-dark-600 flex items-center justify-center mb-4">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
                                        <p className="text-dark-400">Loading resume...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="aspect-[8.5/11] bg-dark-700/50 rounded-lg border border-dark-600 flex items-center justify-center mb-4">
                                    <div className="text-center">
                                        <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                        <p className="text-red-400">{error}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={loadResumesList}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            ) : !hasResume ? (
                                <div className="aspect-[8.5/11] bg-dark-700/50 rounded-lg border border-dark-600 flex items-center justify-center mb-4">
                                    <div className="text-center">
                                        <FileText className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                                        <p className="text-dark-400">No resume uploaded yet</p>
                                        <p className="text-sm text-dark-500 mt-1">Upload a resume to preview</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-[8.5/11] bg-white rounded-lg border border-dark-600 overflow-hidden mb-4">
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-full"
                                        title="Resume Preview"
                                        style={{ border: 'none' }}
                                    />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    leftIcon={<Eye className="w-4 h-4" />}
                                    onClick={handleViewFullScreen}
                                    disabled={!hasResume}
                                >
                                    Full Preview
                                </Button>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    leftIcon={<Download className="w-4 h-4" />}
                                    onClick={handleDownload}
                                    disabled={!hasResume}
                                >
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* My Resumes Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>My Resumes</CardTitle>
                        <CardDescription>
                            Manage your uploaded resumes ({resumeCount}/5)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingResumes ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto mb-4"></div>
                                <p className="text-dark-400">Loading resumes...</p>
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                                <p className="text-dark-400">No resumes uploaded yet</p>
                                <p className="text-sm text-dark-500 mt-1">Upload your first resume to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {resumes.map((resume) => (
                                    <div
                                        key={resume.id}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${activeResumeId === resume.id
                                                ? 'bg-primary-500/10 border-primary-500/50'
                                                : 'bg-dark-700/30 border-dark-700 hover:border-dark-600'
                                            }`}
                                        onClick={() => handleResumeClick(resume.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                                    <h4 className="font-medium text-dark-100 truncate">
                                                        {resume.resume_name}
                                                    </h4>
                                                    {resume.is_default && (
                                                        <Badge variant="success" size="sm">Default</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-dark-400 ml-7">
                                                    <span>
                                                        {new Date(resume.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    <span>{resume.file_size_kb} KB</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(resume.id, resume.resume_name);
                                                }}
                                                className="ml-4 p-2 rounded-lg hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition-colors"
                                                title="Delete resume"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ResumeTools;
