
import { useState } from 'react';
import { X, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button, Badge } from '../ui';
import { getApplicationResume } from '../../api/applications';

const ApplicantDetailsModal = ({ applicant, isOpen, onClose, onUpdateStatus }) => {
    if (!isOpen || !applicant) return null;

    const {
        candidate_name,
        candidate_email,
        resume_name,
        resume_id,
        answers = [],
        status,
        job_title
    } = applicant;

    const [viewingResume, setViewingResume] = useState(false);

    const handleViewResume = async () => {
        try {
            setViewingResume(true);
            const blob = await getApplicationResume(applicant.id);

            // Create object URL
            const url = window.URL.createObjectURL(blob);

            // Open in new tab
            window.open(url, '_blank');

            // Cleanup after a delay (let browser load it first)
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);

        } catch (error) {
            console.error("Failed to fetch resume:", error);
            alert("Failed to load resume. It might not be available.");
        } finally {
            setViewingResume(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-dark-700 bg-dark-800 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-dark-100">{candidate_name}</h2>
                        <p className="text-primary-400 font-medium">{job_title}</p>
                        <p className="text-sm text-dark-400">{candidate_email}</p>
                    </div>
                    <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-dark-700/30 rounded-lg border border-dark-700">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-dark-400">Current Status:</span>
                            <Badge>{status}</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(applicant.id, 'Interview')}>
                                Interview
                            </Button>
                            <Button size="sm" variant="primary" onClick={() => onUpdateStatus(applicant.id, 'Offer')}>
                                Offer
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onUpdateStatus(applicant.id, 'Rejected')}>
                                Reject
                            </Button>
                        </div>
                    </div>

                    {/* Resume */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Resume</h3>
                        <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg border border-dark-600">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-primary-400" />
                                <div>
                                    <p className="font-medium text-dark-200">{resume_name || 'Resume.pdf'}</p>
                                    <p className="text-xs text-dark-500"> Attached with application</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={handleViewResume} disabled={viewingResume}>
                                {viewingResume ? 'Loading...' : 'View / Download'}
                            </Button>
                        </div>
                    </div>

                    {/* Screening Questions */}
                    {answers && answers.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Screening Questions</h3>
                            <div className="space-y-4">
                                {answers.map((ans, idx) => (
                                    <div key={idx} className="p-4 bg-dark-700/20 rounded-lg border border-dark-700">
                                        <p className="text-sm text-dark-400 mb-2">{ans.question}</p>
                                        <p className="text-white font-medium pl-2 border-l-2 border-primary-500">
                                            {ans.answer === 'true' ? 'Yes' : ans.answer === 'false' ? 'No' : ans.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicantDetailsModal;
