
import axios from './axios';

// Get Applications (Job Seeker)
export const getUserApplications = async () => {
    // Note: This endpoint might need to be created in backend if not exists
    // Currently backend has /recruiter/applications, need one for job seeker if not already there
    // But for now keeping as is or creating apply endpoint
    const response = await axios.get('/applications/my-applications');
    return response.data;
};

// Apply to a specific job
export const applyToJob = async (jobId, payload) => {
    // payload: { resume_id, answers: [{question_id, answer}] }
    const response = await axios.post(`/jobs/${jobId}/apply`, payload);
    return response.data;
};

// Recruiter: Get applications for a job
export const getJobApplications = async (jobId) => {
    const response = await axios.get(`/recruiter/jobs/${jobId}/applications`);
    return response.data;
};

// Recruiter: Get ALL applications
export const getAllRecruiterApplications = async () => {
    const response = await axios.get('/recruiter/applications');
    return response.data;
};

// Recruiter: Update application status
export const updateApplicationStatus = async (appId, status) => {
    const response = await axios.patch(`/recruiter/applications/${appId}/status`, { status });
    return response.data;
};

// Recruiter: Get Application Resume
export const getApplicationResume = async (applicationId) => {
    const response = await axios.get(`/recruiter/applications/${applicationId}/resume`, {
        responseType: 'blob'
    });
    return response.data; // Returns Blob
};
