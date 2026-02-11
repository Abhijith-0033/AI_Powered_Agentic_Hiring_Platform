import axios from 'axios';

const API_URL = 'http://localhost:3000/api/interviews';

// Get auth token from localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Select a candidate for interview
 */
export const selectCandidateForInterview = async (jobId, applicationId, candidateId) => {
    const response = await axios.post(
        `${API_URL}/select`,
        { jobId, applicationId, candidateId },
        { headers: getAuthHeader() }
    );
    return response.data;
};

/**
 * Schedule an interview
 */
export const scheduleInterview = async (interviewId, scheduleData) => {
    const response = await axios.put(
        `${API_URL}/schedule/${interviewId}`,
        scheduleData,
        { headers: getAuthHeader() }
    );
    return response.data;
};

/**
 * Send interview invitation email
 */
export const sendInterviewEmail = async (interviewId) => {
    const response = await axios.post(
        `${API_URL}/send-email/${interviewId}`,
        {},
        { headers: getAuthHeader() }
    );
    return response.data;
};

/**
 * Get recruiter's interviews
 */
export const getRecruiterInterviews = async () => {
    const response = await axios.get(`${API_URL}/recruiter`, {
        headers: getAuthHeader()
    });
    return response.data;
};

/**
 * Get candidate's interviews
 */
export const getCandidateInterviews = async () => {
    const response = await axios.get(`${API_URL}/candidate`, {
        headers: getAuthHeader()
    });
    return response.data;
};

/**
 * Join interview (get Agora token)
 */
export const joinInterview = async (channelName) => {
    const response = await axios.post(
        `${API_URL}/join`,
        { channelName },
        { headers: getAuthHeader() }
    );
    return response.data;
};

/**
 * Cancel interview
 */
export const cancelInterview = async (interviewId) => {
    const response = await axios.delete(`${API_URL}/${interviewId}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export default {
    selectCandidateForInterview,
    scheduleInterview,
    sendInterviewEmail,
    getRecruiterInterviews,
    getCandidateInterviews,
    joinInterview,
    cancelInterview
};
