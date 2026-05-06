import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Briefcase, Building2, User } from 'lucide-react';
import { getCandidateInterviews } from '../../services/interviewService';

const InterviewsPage = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const response = await getCandidateInterviews();
            setInterviews(response.data || []);
        } catch (error) {
            console.error('Error fetching interviews:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Parse a scheduled_at value from the DB correctly.
     * The DB stores it as e.g. "2026-05-06T10:00:00+05:30" (WITH tz) or
     * "2026-05-06 10:00" (WITHOUT tz). new Date() treats no-tz strings as
     * UTC which causes a 5.5h offset in India. We detect and handle both.
     */
    const parseScheduledAt = (scheduledAt) => {
        if (!scheduledAt) return null;
        const s = String(scheduledAt);
        // Already has timezone info (Z, +HH:MM, -HH:MM) — parse as-is
        if (/[Z]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) {
            return new Date(s);
        }
        // No timezone — treat as LOCAL time (not UTC) by appending the local offset
        // This avoids the UTC interpretation that breaks IST users
        const localOffset = -new Date().getTimezoneOffset(); // minutes
        const sign = localOffset >= 0 ? '+' : '-';
        const absOffset = Math.abs(localOffset);
        const hh = String(Math.floor(absOffset / 60)).padStart(2, '0');
        const mm = String(absOffset % 60).padStart(2, '0');
        return new Date(`${s.replace(' ', 'T')}${sign}${hh}:${mm}`);
    };

    const handleJoinInterview = (channelName, scheduledAt) => {
        // If no scheduled time, allow joining (recruiter may have used Start Now)
        if (!scheduledAt) {
            window.location.href = `/interview/${channelName}`;
            return;
        }

        const interviewTime = parseScheduledAt(scheduledAt);
        const now = new Date();
        const timeDiff = (interviewTime - now) / (1000 * 60); // minutes

        if (timeDiff > 30) {
            alert(`Interview starts in ${Math.round(timeDiff)} minutes. You can join 30 minutes before the scheduled time.`);
            return;
        }

        if (timeDiff < -180) {
            alert('This interview session has ended (more than 3 hours ago).');
            return;
        }

        window.location.href = `/interview/${channelName}`;
    };

    const formatDate = (date) => {
        if (!date) return 'Not scheduled';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            scheduled: { bg: 'bg-green-100', text: 'text-green-800', label: 'Scheduled' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const canJoinInterview = (scheduledAt, status) => {
        if (status !== 'scheduled') return false;
        // If no scheduled_at (e.g. Start Now flow or legacy record), allow joining
        if (!scheduledAt) return true;
        const interviewTime = parseScheduledAt(scheduledAt);
        if (!interviewTime || isNaN(interviewTime.getTime())) return true; // unparseable → allow
        const now = new Date();
        const timeDiff = (interviewTime - now) / (1000 * 60);
        // Allow joining 30 min before and up to 3 hours after scheduled time
        return timeDiff <= 30 && timeDiff >= -180;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your interviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Interviews</h1>
                    <p className="text-gray-600 mt-2">View and join your scheduled interviews</p>
                </div>

                {/* Interviews List */}
                <div className="space-y-4">
                    {interviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No interviews scheduled</p>
                            <p className="text-sm text-gray-400 mt-2">Your upcoming interviews will appear here</p>
                        </div>
                    ) : (
                        interviews.map((interview) => (
                            <div key={interview.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Briefcase className="w-5 h-5 text-indigo-600" />
                                            <h3 className="text-xl font-semibold text-gray-900">{interview.job_title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                                            <Building2 className="w-4 h-4" />
                                            <span>{interview.company_name}</span>
                                        </div>
                                        {interview.recruiter_name && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-4 h-4" />
                                                <span className="text-sm">Interviewer: {interview.recruiter_name}</span>
                                            </div>
                                        )}
                                    </div>
                                    {getStatusBadge(interview.status)}
                                </div>

                                {interview.status === 'scheduled' && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Date</p>
                                                    <p className="font-medium text-gray-900">{formatDate(interview.interview_date)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <Clock className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Time</p>
                                                    <p className="font-medium text-gray-900">
                                                        {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {interview.status === 'scheduled' && (
                                    <div className="flex gap-3">
                                        {canJoinInterview(interview.scheduled_at, interview.status) ? (
                                            <button
                                                onClick={() => handleJoinInterview(interview.channel_name, interview.scheduled_at)}
                                                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <Video className="w-5 h-5" />
                                                Join Interview
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="flex-1 px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                            >
                                                <Video className="w-5 h-5" />
                                                Interview Not Started
                                            </button>
                                        )}
                                    </div>
                                )}

                                {interview.status === 'pending' && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800">
                                            ⏳ Your interview is being scheduled. You'll receive an email once the date and time are confirmed.
                                        </p>
                                    </div>
                                )}

                                {interview.status === 'cancelled' && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-800">
                                            ✗ This interview has been cancelled. Please reach out to the recruiter for more information.
                                        </p>
                                    </div>
                                )}

                                {interview.status === 'completed' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            ✓ This interview has been completed. Thank you for your participation!
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewsPage;
