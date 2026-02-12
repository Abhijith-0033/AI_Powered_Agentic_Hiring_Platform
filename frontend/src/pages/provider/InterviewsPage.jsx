import { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Video, User, Briefcase, ClipboardCheck, ChevronDown, Search, CheckCircle, XCircle, X } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { scheduleInterview, sendInterviewEmail, cancelInterview, selectCandidateForInterview } from '../../services/interviewService';
import axios from '../../api/axios';

const InterviewsPage = () => {
    // Jobs
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Test section
    const [testJobId, setTestJobId] = useState('');
    const [testCandidates, setTestCandidates] = useState([]);
    const [loadingTest, setLoadingTest] = useState(false);

    // Interview section
    const [interviewJobId, setInterviewJobId] = useState('');
    const [interviewCandidates, setInterviewCandidates] = useState([]);
    const [loadingInterview, setLoadingInterview] = useState(false);

    // Schedule modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [scheduleForm, setScheduleForm] = useState({
        interviewDate: '',
        startTime: '',
        endTime: ''
    });

    // Fetch recruiter's jobs
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoadingJobs(true);
                const res = await axios.get('/jobs/recruiter');
                const jobList = res.data?.data || [];
                setJobs(jobList);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchJobs();
    }, []);

    // Fetch candidates for test section when job changes
    useEffect(() => {
        if (!testJobId) { setTestCandidates([]); return; }
        const fetchTestCandidates = async () => {
            try {
                setLoadingTest(true);
                const res = await axios.get(`/recruiter/jobs/${testJobId}/applications`);
                setCandidatesForSection(res.data?.data || [], setTestCandidates);
            } catch (error) {
                console.error('Error fetching test candidates:', error);
            } finally {
                setLoadingTest(false);
            }
        };
        fetchTestCandidates();
    }, [testJobId]);

    // Fetch candidates for interview section when job changes
    useEffect(() => {
        if (!interviewJobId) { setInterviewCandidates([]); return; }
        const fetchInterviewCandidates = async () => {
            try {
                setLoadingInterview(true);
                const res = await axios.get(`/recruiter/jobs/${interviewJobId}/applications`);
                setCandidatesForSection(res.data?.data || [], setInterviewCandidates);
            } catch (error) {
                console.error('Error fetching interview candidates:', error);
            } finally {
                setLoadingInterview(false);
            }
        };
        fetchInterviewCandidates();
    }, [interviewJobId]);

    const setCandidatesForSection = (data, setter) => {
        setter(data);
    };

    // Status update for candidates
    const handleStatusUpdate = async (applicationId, newStatus, section) => {
        try {
            await axios.patch(`/recruiter/applications/${applicationId}/status`, { status: newStatus });

            // Refresh the section
            if (section === 'test' && testJobId) {
                const res = await axios.get(`/recruiter/jobs/${testJobId}/applications`);
                setCandidatesForSection(res.data?.data || [], setTestCandidates);
            } else if (section === 'interview' && interviewJobId) {
                const res = await axios.get(`/recruiter/jobs/${interviewJobId}/applications`);
                setCandidatesForSection(res.data?.data || [], setInterviewCandidates);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status: ' + (error.response?.data?.message || error.message));
        }
    };

    // Schedule modal
    const handleScheduleClick = (candidate) => {
        setSelectedCandidate(candidate);
        setShowScheduleModal(true);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduleForm({
            interviewDate: tomorrow.toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '11:00'
        });
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Single combined call — creates interview record if needed AND schedules it
            await axios.post('/interviews/create-and-schedule', {
                jobId: interviewJobId,
                applicationId: selectedCandidate.id,
                candidateId: selectedCandidate.candidate_id,
                interviewDate: scheduleForm.interviewDate,
                startTime: scheduleForm.startTime,
                endTime: scheduleForm.endTime
            });

            alert('Interview scheduled successfully!');
            setShowScheduleModal(false);

            // Refresh
            if (interviewJobId) {
                const res = await axios.get(`/recruiter/jobs/${interviewJobId}/applications`);
                setCandidatesForSection(res.data?.data || [], setInterviewCandidates);
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
            alert('Failed to schedule interview: ' + (error.response?.data?.message || error.message));
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || 'applied').toLowerCase();
        const config = {
            applied: { label: 'Applied', bg: 'bg-blue-100', text: 'text-blue-800' },
            shortlisted: { label: 'Shortlisted', bg: 'bg-emerald-100', text: 'text-emerald-800' },
            shortlisted_for_test: { label: 'Test', bg: 'bg-amber-100', text: 'text-amber-800' },
            interview: { label: 'Interview', bg: 'bg-indigo-100', text: 'text-indigo-800' },
            accepted: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-800' },
            rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
        };
        const c = config[s] || config.applied;
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
    };

    // Candidate table for a section
    const CandidateTable = ({ candidates, loading, section, emptyIcon, emptyText }) => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            );
        }

        if (candidates.length === 0) {
            return (
                <div className="text-center py-10">
                    {emptyIcon}
                    <p className="text-neutral-500 font-medium mt-3">{emptyText}</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Candidate</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Experience</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Applied</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {candidates.map((candidate) => {
                            const s = (candidate.status || 'applied').toLowerCase();
                            return (
                                <tr key={candidate.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${section === 'test' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                                <User className={`w-5 h-5 ${section === 'test' ? 'text-amber-600' : 'text-indigo-600'}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900">{candidate.candidate_name || 'Unknown'}</p>
                                                <p className="text-sm text-neutral-500">{candidate.candidate_email || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-neutral-600 text-sm">
                                        {candidate.experience_years ? `${candidate.experience_years} years` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 text-neutral-500 text-sm">
                                        {candidate.applied_at ? new Date(candidate.applied_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(candidate.status)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {section === 'test' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'shortlisted_for_test', section)}
                                                        disabled={s === 'shortlisted_for_test'}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${s === 'shortlisted_for_test' ? 'bg-amber-200 text-amber-900 cursor-default' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                                    >
                                                        Shortlist for Test
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'interview', section)}
                                                        disabled={s === 'interview'}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${s === 'interview' ? 'bg-indigo-200 text-indigo-900 cursor-default' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                                    >
                                                        Move to Interview
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'rejected', section)}
                                                        disabled={s === 'rejected'}
                                                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {section === 'interview' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'interview', section)}
                                                        disabled={s === 'interview'}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${s === 'interview' ? 'bg-indigo-200 text-indigo-900 cursor-default' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                                    >
                                                        Select for Interview
                                                    </button>
                                                    <button
                                                        onClick={() => handleScheduleClick(candidate)}
                                                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1"
                                                    >
                                                        <Calendar className="w-3 h-3" />
                                                        Schedule
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'accepted', section)}
                                                        disabled={s === 'accepted'}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${s === 'accepted' ? 'bg-green-200 text-green-900 cursor-default' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'rejected', section)}
                                                        disabled={s === 'rejected'}
                                                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // Job selector dropdown
    const JobSelector = ({ value, onChange, id }) => (
        <div className="relative">
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full md:w-80 appearance-none px-4 py-2.5 pr-10 bg-white border border-neutral-300 rounded-lg text-neutral-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
                <option value="">— Select a Job —</option>
                {jobs.map(job => (
                    <option key={job.job_id} value={job.job_id}>
                        {job.job_title} ({job.status})
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
    );

    if (loadingJobs) {
        return (
            <DashboardLayout type="provider" title="Tests & Interviews">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="provider" title="Tests & Interviews">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900">Tests & Interviews</h2>
                    <p className="text-neutral-500 mt-1">Select a job to view and manage candidates for tests and interviews</p>
                </div>

                {/* ============== SECTION 1: TESTS ============== */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm mb-8">
                    <div className="p-6 border-b border-neutral-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-amber-600" />
                                    Test Section
                                </h3>
                                <p className="text-sm text-neutral-500 mt-1">Manage candidates for assessments and tests</p>
                            </div>
                            <JobSelector value={testJobId} onChange={setTestJobId} id="test-job-select" />
                        </div>
                    </div>

                    <div className="p-6">
                        {!testJobId ? (
                            <div className="text-center py-10">
                                <Briefcase className="w-14 h-14 text-neutral-200 mx-auto mb-3" />
                                <p className="text-neutral-500 font-medium">Select a job to view candidates</p>
                                <p className="text-sm text-neutral-400 mt-1">Use the dropdown above to pick a job posting</p>
                            </div>
                        ) : (
                            <CandidateTable
                                candidates={testCandidates}
                                loading={loadingTest}
                                section="test"
                                emptyIcon={<ClipboardCheck className="w-14 h-14 text-neutral-200 mx-auto" />}
                                emptyText="No candidates applied for this job yet"
                            />
                        )}
                    </div>
                </div>

                {/* ============== SECTION 2: INTERVIEWS ============== */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
                    <div className="p-6 border-b border-neutral-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                    <Video className="w-5 h-5 text-indigo-600" />
                                    Interview Section
                                </h3>
                                <p className="text-sm text-neutral-500 mt-1">Manage candidates for interviews — schedule, accept, or reject</p>
                            </div>
                            <JobSelector value={interviewJobId} onChange={setInterviewJobId} id="interview-job-select" />
                        </div>
                    </div>

                    <div className="p-6">
                        {!interviewJobId ? (
                            <div className="text-center py-10">
                                <Briefcase className="w-14 h-14 text-neutral-200 mx-auto mb-3" />
                                <p className="text-neutral-500 font-medium">Select a job to view candidates</p>
                                <p className="text-sm text-neutral-400 mt-1">Use the dropdown above to pick a job posting</p>
                            </div>
                        ) : (
                            <CandidateTable
                                candidates={interviewCandidates}
                                loading={loadingInterview}
                                section="interview"
                                emptyIcon={<Video className="w-14 h-14 text-neutral-200 mx-auto" />}
                                emptyText="No candidates applied for this job yet"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ============== SCHEDULE MODAL ============== */}
            {showScheduleModal && selectedCandidate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-neutral-900">Schedule Interview</h2>
                            <button onClick={() => setShowScheduleModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-neutral-500 mb-6">
                            For <strong>{selectedCandidate.candidate_name}</strong>
                        </p>

                        <form onSubmit={handleScheduleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Interview Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={scheduleForm.interviewDate}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewDate: e.target.value })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={scheduleForm.startTime}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                    className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    Schedule Interview
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default InterviewsPage;
