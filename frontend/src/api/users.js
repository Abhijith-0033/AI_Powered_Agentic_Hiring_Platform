import axios from './axios';

// Get Candidate Profile (authenticated user's profile)
export const getUserProfile = async () => {
    const response = await axios.get('/candidates/profile');
    return response.data;
};

// Update Candidate Profile (Bulk)
export const updateUserProfile = async (data) => {
    const response = await axios.post('/candidates/profile', data);
    return response.data;
};

// Update Fresher Status
export const updateFresherStatus = async (isFresher) => {
    const response = await axios.patch('/candidates/fresher-status', { is_fresher: isFresher });
    return response.data;
};

// Add Education (Single)
export const addEducation = async (data) => {
    const response = await axios.post('/candidates/education', data);
    return response.data;
};

// Add Experience (Single)
export const addExperience = async (data) => {
    const response = await axios.post('/candidates/experience', data);
    return response.data;
};

// Get Dashboard Stats
export const getDashboardStats = async () => {
    const response = await axios.get('/dashboard/stats');
    return response.data;
};

// Get Dashboard Activity
export const getUserActivity = async () => {
    const response = await axios.get('/dashboard/activity');
    return response.data;
};

// ============================================================
// RESUME MANAGEMENT (Multi-Resume Support)
// ============================================================

// Get all resumes for authenticated user
export const getAllResumes = async () => {
    const response = await axios.get('/candidate/resumes');
    return response.data;
};

// Fetch Profile resume (from candidates.resume_url)
// Used by Profile page "View Resume" button
export const getProfileResume = async () => {
    const response = await axios.get('/candidates/resume', {
        responseType: 'blob'
    });
    return response.data; // Returns Blob
};

// Fetch specific resume PDF by ID from Resume Tools
export const fetchResume = async (resumeId) => {
    const response = await axios.get(`/candidate/resumes/${resumeId}`, {
        responseType: 'blob'
    });
    return response.data; // Returns Blob
};

// Upload new resume
// Options: { syncProfile: boolean } - if true, also updates candidates.resume_url
export const uploadResume = async (file, options = {}) => {
    // Convert file to base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const base64 = await toBase64(file);

    // Add syncProfile query param if requested
    const queryParam = options.syncProfile ? '?syncProfile=true' : '';

    const response = await axios.post(`/candidate/resumes${queryParam}`, {
        resume_name: file.name,
        file_data: base64
    });
    return response.data;
};

// Delete a resume
export const deleteResume = async (resumeId) => {
    const response = await axios.delete(`/candidate/resumes/${resumeId}`);
    return response.data;
};

// Set a resume as default (syncs with profile)
export const setDefaultResume = async (resumeId) => {
    const response = await axios.patch(`/candidate/resumes/${resumeId}/set-default`);
    return response.data;
};
