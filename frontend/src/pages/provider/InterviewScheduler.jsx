import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui';
import { Calendar, Clock, Users, CheckCircle, ArrowLeft } from 'lucide-react';

const InterviewScheduler = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [topCandidates, setTopCandidates] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [message, setMessage] = useState(null);
    const [scheduledData, setScheduledData] = useState(null);

    // Form state
    const [interviewDate, setInterviewDate] = useState('');
    const [startTime, setStartTime] = useState('10:00');
    const [slotDuration, setSlotDuration] = useState(30);
    const [mode, setMode] = useState('online');
    const [meetingLink, setMeetingLink] = useState('');

    // Fetch jobs on mount
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await api.get('/ai-tools/jobs');
                if (response.data.success) {
                    setJobs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
                setMessage({ type: 'error', text: 'Failed to load jobs.' });
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchJobs();
    }, []);

    // Fetch top 10 candidates when job is selected
    useEffect(() => {
        if (!selectedJob) {
            setTopCandidates([]);
            setScheduledData(null);
            return;
        }

        const fetchTopCandidates = async () => {
            setLoadingCandidates(true);
            setMessage(null);
            try {
                const response = await api.get(`/ai-tools/jobs/${selectedJob}/candidates`);
                if (response.data.success) {
                    // Filter only AI-ranked candidates and take top 10
                    const aiRanked = response.data.data
                        .filter(c => c.match_score !== null && c.shortlisted_by_ai)
                        .slice(0, 10);

                    setTopCandidates(aiRanked);

                    if (aiRanked.length === 0) {
                        setMessage({
                            type: 'warning',
                            text: 'No AI-ranked candidates found. Please run Auto Shortlist first.'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching candidates:', error);
                setMessage({ type: 'error', text: 'Failed to load candidates.' });
            } finally {
                setLoadingCandidates(false);
            }
        };

        fetchTopCandidates();
    }, [selectedJob]);

    // Handle interview scheduling
    const handleScheduleInterviews = async (e) => {
        e.preventDefault();

        if (!selectedJob || topCandidates.length === 0) {
            setMessage({ type: 'error', text: 'Please select a job with AI-ranked candidates.' });
            return;
        }

        if (!interviewDate || !startTime) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        if (mode === 'online' && !meetingLink) {
            setMessage({ type: 'error', text: 'Please provide a meeting link for online interviews.' });
            return;
        }

        setScheduling(true);
        setMessage(null);

        try {
            const response = await api.post(`/interviews/schedule/${selectedJob}`, {
                interviewDate,
                startTime,
                slotDuration,
                mode,
                meetingLink: mode === 'online' ? meetingLink : null
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                setScheduledData(response.data.data);

                // Reset form
                setInterviewDate('');
                setStartTime('10:00');
                setMeetingLink('');
            }
        } catch (error) {
            console.error('Error scheduling interviews:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to schedule interviews.'
            });
        } finally {
            setScheduling(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/provider/ai-tools')}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Interview Scheduler</h1>
                    <p className="mt-2 text-lg text-neutral-500">
                        Automatically schedule interviews for your top 10 AI-ranked candidates.
                    </p>
                </div>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' :
                        message.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Job Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Job</CardTitle>
                    <CardDescription>Choose a job to schedule interviews for.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingJobs ? (
                        <div className="animate-pulse h-10 bg-gray-100 rounded w-full sm:w-1/2"></div>
                    ) : (
                        <select
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            className="block w-full sm:w-1/2 rounded-lg border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                        >
                            <option value="">-- Select a Job --</option>
                            {jobs.map((job) => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.job_title} ({job.applicant_count} applicants) - {job.location}
                                </option>
                            ))}
                        </select>
                    )}
                </CardContent>
            </Card>

            {/* Top 10 Candidates Preview */}
            {selectedJob && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Top 10 AI-Ranked Candidates
                        </CardTitle>
                        <CardDescription>
                            Interviews will be scheduled for these candidates in sequential time slots.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingCandidates ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse h-12 bg-gray-100 rounded"></div>
                                ))}
                            </div>
                        ) : topCandidates.length === 0 ? (
                            <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
                                <p className="text-yellow-700 font-medium">No AI-ranked candidates found.</p>
                                <p className="text-sm text-yellow-600 mt-1">Please run Auto Shortlist first.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {topCandidates.map((candidate, index) => (
                                    <div
                                        key={candidate.application_id}
                                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                                ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}
                                            `}>
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-900">{candidate.candidate_name}</p>
                                                <p className="text-sm text-neutral-500">{candidate.candidate_email}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                            {candidate.match_score}% Match
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Scheduling Form */}
            {selectedJob && topCandidates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Interview Details
                        </CardTitle>
                        <CardDescription>
                            Configure interview schedule. Each candidate will get a sequential time slot.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleScheduleInterviews} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Interview Date */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Interview Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="block w-full rounded-lg border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                                        required
                                    />
                                </div>

                                {/* Start Time */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="block w-full rounded-lg border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                                        required
                                    />
                                </div>

                                {/* Slot Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Slot Duration <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={slotDuration}
                                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                                        className="block w-full rounded-lg border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                                        required
                                    >
                                        <option value={30}>30 minutes</option>
                                        <option value={45}>45 minutes</option>
                                        <option value={60}>60 minutes</option>
                                    </select>
                                </div>

                                {/* Interview Mode */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Interview Mode <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="online"
                                                checked={mode === 'online'}
                                                onChange={(e) => setMode(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-neutral-700">Online</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="offline"
                                                checked={mode === 'offline'}
                                                onChange={(e) => setMode(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-neutral-700">Offline</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Link (conditional) */}
                            {mode === 'online' && (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Meeting Link <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                        className="block w-full rounded-lg border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4"
                                        required={mode === 'online'}
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={scheduling || topCandidates.length === 0}
                                    className="btn btn-primary"
                                >
                                    {scheduling ? (
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Scheduling...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Schedule {topCandidates.length} Interviews
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Scheduled Interviews Result */}
            {scheduledData && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                            <CheckCircle className="w-5 h-5" />
                            Interviews Scheduled Successfully!
                        </CardTitle>
                        <CardDescription className="text-green-700">
                            {scheduledData.scheduledInterviews.length} candidates have been notified.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="grid md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-green-200">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Job</p>
                                    <p className="text-sm font-bold text-neutral-900">{scheduledData.jobTitle}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Date</p>
                                    <p className="text-sm font-bold text-neutral-900">
                                        {new Date(scheduledData.interviewDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-500">Mode</p>
                                    <p className="text-sm font-bold text-neutral-900 capitalize">{scheduledData.mode}</p>
                                </div>
                                {scheduledData.meetingLink && (
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">Meeting Link</p>
                                        <a
                                            href={scheduledData.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-bold text-indigo-600 hover:underline"
                                        >
                                            {scheduledData.meetingLink}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-green-900">Scheduled Time Slots:</p>
                                {scheduledData.scheduledInterviews.map((interview, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                                    >
                                        <span className="font-medium text-neutral-900">{interview.candidateName}</span>
                                        <span className="text-sm font-bold text-indigo-600">{interview.timeSlot}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default InterviewScheduler;
