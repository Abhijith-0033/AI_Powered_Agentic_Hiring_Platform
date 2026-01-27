import axios from './axios';

// Get Jobs with filters
export const getJobs = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    // Add other filters if backend supports them directly, 
    // otherwise we might filter client-side or update backend to support them.
    // Current backend only supports 'status'.
    // We will fetch all open jobs and filter client side for now or basic status filter.

    // Note: The UI has role, experience, location, remote.
    // The backend `GET /api/jobs` currently only takes `status`.
    // We can fetch all and filtering in UI is acceptable if dataset is small, 
    // BUT efficient way is backend filtering.
    // For this task "remove mock data", fetching from DB is the key.

    const response = await axios.get(`/jobs?${params.toString()}`);
    return response.data;
};

export const getJobById = async (id) => {
    const response = await axios.get(`/jobs/${id}`);
    return response.data;
};
// Get External Jobs (Adzuna - India)
export const getJobsInIndia = async (params = {}) => {
    // Filter out empty values to avoid sending ?role=&location=
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );
    const queryParams = new URLSearchParams(cleanParams).toString();
    const response = await axios.get(`/jobs/india${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
};
