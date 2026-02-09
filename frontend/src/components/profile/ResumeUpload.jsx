import { Eye, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, FileUpload } from '../ui';

const ResumeUpload = ({ hasResume, resumeFile, onSelectFile, onDelete, pViewResume, onReupload }) => {
    // Note: pViewResume is handleViewResume, etc.
    // Simplifying props: 
    // hasResume (bool), 
    // resumeFile (File object or null), 
    // onFileSelect (function), 
    // onView (function), 
    // onDelete (function),
    // onReupload (function) - wait, reupload logic in Profile.jsx is specific. 
    // Let's pass handlers.

    return (
        <Card className="mb-6">
            <CardHeader><CardTitle>Resume</CardTitle></CardHeader>
            <CardContent>
                {hasResume ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-success-600">
                            <span className="font-medium">Resume uploaded</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="secondary" onClick={pViewResume} leftIcon={<Eye className="w-4 h-4" />}>View Resume</Button>
                            <Button variant="outline" onClick={onDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete Resume</Button>
                            <FileUpload accept=".pdf" hint="PDF (Max 10MB)" onFileSelect={onReupload} customButton={(onClick) => (
                                <Button variant="primary" onClick={onClick} leftIcon={<Upload className="w-4 h-4" />}>Replace Resume</Button>
                            )} />
                        </div>
                    </div>
                ) : (
                    <div>
                        <FileUpload accept=".pdf" hint="PDF (Max 10MB)" onFileSelect={onSelectFile} />
                        {resumeFile && <p className="text-sm text-success-600 mt-3">{resumeFile.name} selected - Click "Save Profile" to upload</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ResumeUpload;
