import axios from 'axios';

// Create axios instance with base URL
const instance = axios.create({
    baseURL: 'http://localhost:3000/api', // Adjustment based on backend port (assuming 5000 or 3000, need to check)
    withCredentials: true // Important for cookies/sessions if used, or headers
});

// Add a request interceptor to add the auth token to every request
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;
