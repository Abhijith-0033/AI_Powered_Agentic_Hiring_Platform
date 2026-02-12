import axios from '../api/axios';

/**
 * Test Module Service
 * Handles all API calls for the test module (recruiter and candidate)
 */

// ============ RECRUITER SERVICES ============

export const createTest = async (data) => {
    const res = await axios.post('/tests', data);
    return res.data;
};

export const getRecruiterTests = async () => {
    const res = await axios.get('/tests');
    return res.data;
};

export const getTestById = async (id) => {
    const res = await axios.get(`/tests/${id}`);
    return res.data;
};

export const updateTest = async (id, data) => {
    const res = await axios.put(`/tests/${id}`, data);
    return res.data;
};

export const deleteTest = async (id) => {
    const res = await axios.delete(`/tests/${id}`);
    return res.data;
};

export const publishTest = async (id) => {
    const res = await axios.post(`/tests/${id}/publish`);
    return res.data;
};

export const getTestResults = async (id) => {
    const res = await axios.get(`/tests/${id}/results`);
    return res.data;
};

export const publishTestResults = async (id) => {
    const res = await axios.post(`/tests/${id}/publish-results`);
    return res.data;
};

// ============ CANDIDATE SERVICES ============

export const getMyTests = async () => {
    const res = await axios.get('/tests/my-tests');
    return res.data;
};

export const getTestForAttempt = async (id) => {
    const res = await axios.get(`/tests/${id}/attempt`);
    return res.data;
};

export const submitTest = async (id, data) => {
    const res = await axios.post(`/tests/${id}/submit`, data);
    return res.data;
};

export const saveTestProgress = async (id, data) => {
    const res = await axios.post(`/tests/${id}/save-progress`, data);
    return res.data;
};

export const getMyTestResult = async (id) => {
    const res = await axios.get(`/tests/${id}/my-result`);
    return res.data;
};
