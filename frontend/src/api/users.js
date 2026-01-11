import axios from './axios';

// Get Candidate Profile
export const getUserProfile = async (email) => {
    // If no email is provided, we should assume '/me' if it existed, 
    // but sticking to existing pattern, we might need email.
    // However, for this task, I am focusing on 'Add Education' which relies on the token in the backend.
    // The Profile page fetch logic is separate (and was refactored in previous task).
    const response = await axios.get(`/candidates/${email}`);
    return response.data;
};

// Update Candidate Profile (Bulk)
export const updateUserProfile = async (data) => {
    const response = await axios.post('/candidates/profile', data);
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
