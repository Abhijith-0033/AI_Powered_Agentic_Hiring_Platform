
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getApplicationProfileSnapshot, getApplicationResume } from '../../api/applications';
import CandidateProfileContent from './CandidateProfileContent';

/**
 * CandidateProfilePanel
 * A side-panel component for recruiters to view a candidate's profile snapshot.
 * Used in ApplicantManagement to show full candidate details.
 */
const CandidateProfilePanel = ({ applicationId, isOpen, onClose, candidateName = 'Candidate', initialData = null, initialResumeUrl = null }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileData, setProfileData] = useState(null);
    const [isSnapshot, setIsSnapshot] = useState(false);
    const [snapshotDate, setSnapshotDate] = useState(null);
    const [resumeUrl, setResumeUrl] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setProfileData(initialData);
                setLoading(false);
                if (initialResumeUrl) setResumeUrl(initialResumeUrl);
            } else if (applicationId) {
                fetchProfileSnapshot();
                fetchResume();
            }
        }
    }, [isOpen, applicationId, initialData, initialResumeUrl]);

    const fetchProfileSnapshot = async () => {
        if (initialData) return; // Skip if initialData provided
        try {
            setLoading(true);
            setError('');
            const response = await getApplicationProfileSnapshot(applicationId);
            if (response.success) {
                setProfileData(response.data.snapshot);
                setIsSnapshot(response.data.is_snapshot);
                setSnapshotDate(response.data.snapshot_date);
            }
        } catch (err) {
            console.error('Error fetching profile snapshot:', err);
            setError('Failed to load candidate profile.');
        } finally {
            setLoading(false);
        }
    };

    const fetchResume = async () => {
        try {
            const blob = await getApplicationResume(applicationId);
            if (blob && blob.size > 0) {
                const url = URL.createObjectURL(blob);
                setResumeUrl(url);
            }
        } catch (err) {
            console.error('Failed to fetch resume:', err);
        }
    };

    const handleViewResume = () => {
        if (resumeUrl) {
            window.open(resumeUrl, '_blank');
        }
    };

    if (!isOpen) return null;

    const info = profileData?.personal_info || {};

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Side Panel */}
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">{info.name || candidateName}</h2>
                        <p className="text-sm text-neutral-500">{info.title || 'Candidate Profile'}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12 text-neutral-500">Loading profile...</div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">{error}</div>
                    ) : (
                        <CandidateProfileContent
                            data={profileData}
                            resumeUrl={resumeUrl}
                            onViewResume={handleViewResume}
                            isSnapshot={isSnapshot}
                            snapshotDate={snapshotDate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateProfilePanel;
