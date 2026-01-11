import axios from './axios';

// Get Applications
export const getUserApplications = async () => {
    const response = await axios.get('/applications/my-applications');
    return response.data;
};
