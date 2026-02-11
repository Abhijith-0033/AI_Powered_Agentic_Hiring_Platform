import { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Video, User, Briefcase, FileText, X } from 'lucide-react';
import { getRecruiterInterviews, scheduleInterview, sendInterviewEmail, cancelInterview } from '../../services/interviewService';

const InterviewsPage = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [scheduleForm, setScheduleForm] = useState({
        interviewDate: '',
        startTime: '',
        endTime: ''
    });

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const response = await getRecruiterInterviews();
            setInterviews(response.data || []);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            showToast('Failed to fetch interviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleClick = (interview) => {
        setSelectedInterview(interview);
        setShowScheduleModal(true);
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.setDate() + 1);
        setScheduleForm({
            interviewDate: tomorrow.toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '11:00'
        });
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            await scheduleInterview(selectedInterview.id, scheduleForm);
            showToast('Interview scheduled successfully', 'success');
            setShowScheduleModal(false);
            fetchInterviews();
        } catch (error) {
            console.error('Error scheduling interview:', error);
            showToast('Failed to schedule interview', 'error');
        }
    };

    const handleSendEmail = async (interviewId) => {
        try {
            const response = await sendInterviewEmail(interviewId);
            if (response.success) {
                showToast('Interview invitation sent successfully', 'success');
                fetchInterviews();
            } else {
                showToast(response.message, 'warning');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            showToast('Failed to send email', 'error');
        }
    };

    const handleStartInterview = (channelName) => {
        window.location.href = `/interview/${channelName}`;
    };

    const handleCancelInterview = async (interviewId) => {
        if (!confirm('Are you sure you want to cancel this interview?')) return;

        try {
            await cancelInterview(interviewId);
            showToast('Interview cancelled', 'success');
            fetchInterviews();
        } catch (error) {
            console.error('Error cancelling interview:', error);
            showToast('Failed to cancel interview', 'error');
        }
    };

    const showToast = (message, type) => {
        // Simple toast - you can replace with your existing toast system
        alert(message);
    };

    const formatDate = (date) => {
        if (!date) return 'Not scheduled';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    const pendingInterviews = interviews.filter(i => i.status === 'pending');
    const scheduledInterviews = interviews.filter(i => i.status === 'scheduled');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading interviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tests & Interviews</h1>
                    <p className="text-gray-600 mt-2">Manage candidate interviews and assessments</p>
                </div>

                {/* Section A: Selected for Interview (Pending) */}
                <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-yellow-600" />
                            Selected for Interview
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                                {pendingInterviews.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Candidates awaiting interview scheduling</p>
                    </div>

                    <div className="p-6">
                        {pendingInterviews.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No candidates selected for interview</p>
                                <p className="text-sm text-gray-400 mt-2">Go to Applications to select candidates</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Score</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resume</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pendingInterviews.map((interview) => (
                                            <tr key={interview.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{interview.candidate_name}</p>
                                                            <p className="text-sm text-gray-500">{interview.candidate_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-900">{interview.job_title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                        {interview.match_score ? `${interview.match_score}%` : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {interview.resume_url ? (
                                                        <a
                                                            href={interview.resume_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span className="text-sm">View Resume</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No resume</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => handleScheduleClick(interview)}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        Schedule
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section B: Scheduled Interviews */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-600" />
                            Scheduled Interviews
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                {scheduledInterviews.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Upcoming and completed interviews</p>
                    </div>

                    <div className="p-6">
                        {scheduledInterviews.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No scheduled interviews</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {scheduledInterviews.map((interview) => (
                                    <div key={interview.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">{interview.candidate_name}</h3>
                                                    <p className="text-gray-600">{interview.job_title}</p>
                                                    <p className="text-sm text-gray-500">{interview.company_name}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${interview.email_sent
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {interview.email_sent ? '✓ Email Sent' : '⊗ Email Pending'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">{formatDate(interview.interview_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {!interview.email_sent && (
                                                <button
                                                    onClick={() => handleSendEmail(interview.id)}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    Send Email
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStartInterview(interview.channel_name)}
                                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                            >
                                                <Video className="w-4 h-4" />
                                                Start Interview
                                            </button>
                                            <button
                                                onClick={() => handleCancelInterview(interview.id)}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Interview</h2>

                        <form onSubmit={handleScheduleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Interview Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={scheduleForm.interviewDate}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewDate: e.target.value })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={scheduleForm.startTime}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={scheduleForm.endTime}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewsPage;
