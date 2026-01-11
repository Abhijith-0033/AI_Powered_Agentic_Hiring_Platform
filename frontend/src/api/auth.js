const API_URL = 'http://localhost:3000/api/auth';

/**
 * Authentication API Client
 */
export const authAPI = {
    /**
     * Register a new user
     * @param {string} name - User's full name
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} intent - "job" or "employee"
     * @returns {Promise<{token: string, user: object}>}
     */
    register: async (name, email, password, intent) => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, intent })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    },

    /**
     * Login existing user or create new account (combined flow)
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} lookingFor - "job" or "employee"
     * @returns {Promise<{token: string, user: object}>}
     */
    login: async (email, password, lookingFor) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, lookingFor })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    },

    /**
     * Get current user info
     * @param {string} token - JWT token
     * @returns {Promise<{user: object}>}
     */
    getCurrentUser: async (token) => {
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch user');
        }

        return data;
    }
};
