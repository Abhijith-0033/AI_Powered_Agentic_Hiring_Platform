import axios from '../api/axios';

/**
 * Coding Service - API calls for coding test module
 * Base URL: /api/coding
 */

// ============================================================
// RECRUITER APIs
// ============================================================

/**
 * Create a new coding test
 * @param {Object} testData - Test details, questions, and test cases
 * @returns {Promise} API response
 */
export const createCodingTest = async (testData) => {
    const response = await axios.post('/coding/tests', testData);
    return response.data;
};

/**
 * Get all coding tests for recruiter
 * @returns {Promise} API response with test list
 */
export const getRecruiterCodingTests = async () => {
    const response = await axios.get('/coding/tests');
    return response.data;
};

/**
 * Get coding test details by ID (recruiter view with test cases)
 * @param {string} testId - Test ID
 * @returns {Promise} API response with test details
 */
export const getCodingTestById = async (testId) => {
    const response = await axios.get(`/coding/tests/${testId}`);
    return response.data;
};

/**
 * Update coding test (draft only)
 * @param {string} testId - Test ID
 * @param {Object} testData - Updated test data
 * @returns {Promise} API response
 */
export const updateCodingTest = async (testId, testData) => {
    const response = await axios.put(`/coding/tests/${testId}`, testData);
    return response.data;
};

/**
 * Delete coding test
 * @param {string} testId - Test ID
 * @returns {Promise} API response
 */
export const deleteCodingTest = async (testId) => {
    const response = await axios.delete(`/coding/tests/${testId}`);
    return response.data;
};

/**
 * Publish coding test
 * @param {string} testId - Test ID
 * @returns {Promise} API response
 */
export const publishCodingTest = async (testId) => {
    const response = await axios.post(`/coding/tests/${testId}/publish`);
    return response.data;
};

/**
 * Get test results (all candidate submissions)
 * @param {string} testId - Test ID
 * @returns {Promise} API response with results
 */
export const getCodingTestResults = async (testId) => {
    const response = await axios.get(`/coding/tests/${testId}/results`);
    return response.data;
};

/**
 * Publish test results for candidates
 * @param {string} testId - Test ID
 * @returns {Promise} API response
 */
export const publishCodingTestResults = async (testId) => {
    const response = await axios.post(`/coding/tests/${testId}/results/publish`);
    return response.data;
};

// ============================================================
// CANDIDATE APIs
// ============================================================

/**
 * Get all coding tests assigned to candidate
 * @returns {Promise} API response with test list
 */
export const getMyCodingTests = async () => {
    const response = await axios.get('/coding/my-tests');
    return response.data;
};

/**
 * Get test for attempt (candidate view without test cases)
 * @param {string} testId - Test ID
 * @returns {Promise} API response with test details
 */
export const getCodingTestForAttempt = async (testId) => {
    const response = await axios.get(`/coding/tests/${testId}/attempt`);
    return response.data;
};

/**
 * Submit code for a question
 * @param {Object} submissionData - {questionId, testId, sourceCode, language}
 * @returns {Promise} API response with evaluation results
 */
export const submitCode = async (submissionData) => {
    const response = await axios.post('/coding/submit', submissionData);
    return response.data;
};

/**
 * Run code against visible test cases or custom input
 * @param {Object} runData - {questionId, sourceCode, language, mode, customInput}
 * @returns {Promise} API response with run results
 */
export const runCode = async (runData) => {
    const response = await axios.post('/coding/run', runData);
    return response.data;
};

/**
 * Get submission results for a test (if published) - for candidates
 * @param {string} testId - Test ID
 * @returns {Promise} API response with results
 */
export const getCodingSubmissions = async (testId) => {
    const response = await axios.get(`/coding/submissions/${testId}`);
    return response.data;
};

/**
 * Get detailed submission info (for recruiter)
 * @param {string} id - Submission ID
 * @returns {Promise} API response with detailed results
 */
export const getSubmissionById = async (id) => {
    const response = await axios.get(`/coding/submissions/${id}`);
    return response.data;
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get supported programming languages
 * @returns {Array} List of supported languages
 */
export const getSupportedLanguages = () => {
    return [
        { id: 'python3', name: 'Python 3', extension: 'py', template: '# Write your code here\nprint("Hello, World!")' },
        { id: 'cpp', name: 'C++', extension: 'cpp', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
        { id: 'javascript', name: 'JavaScript', extension: 'js', template: '// Write your code here\nconsole.log("Hello, World!");' },
        { id: 'java', name: 'Java', extension: 'java', template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' }
    ];
};

export default {
    // Recruiter
    createCodingTest,
    getRecruiterCodingTests,
    getCodingTestById,
    updateCodingTest,
    deleteCodingTest,
    publishCodingTest,
    getCodingTestResults,
    publishCodingTestResults,
    // Candidate
    getMyCodingTests,
    getCodingTestForAttempt,
    runCode,
    submitCode,
    getCodingSubmissions,
    getSubmissionById,
    // Helpers
    getSupportedLanguages
};
