/**
 * Input Validation Utilities
 */

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password 
 * @returns {object} { valid: boolean, message: string }
 */
export const isValidPassword = (password) => {
    if (!password || password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters long'
        };
    }
    return { valid: true };
};

/**
 * Validate required fields
 * @param {object} fields - Object with field names as keys
 * @param {Array<string>} required - Array of required field names
 * @returns {object} { valid: boolean, message: string }
 */
export const validateRequired = (fields, required) => {
    for (const field of required) {
        if (!fields[field] || fields[field].toString().trim() === '') {
            return {
                valid: false,
                message: `${field} is required`
            };
        }
    }
    return { valid: true };
};

/**
 * Validate user intent (for registration)
 * @param {string} intent 
 * @returns {boolean}
 */
export const isValidIntent = (intent) => {
    return intent === 'job' || intent === 'employee';
};

/**
 * Map user intent to role
 * @param {string} intent - "job" or "employee"
 * @returns {string} "job_seeker" or "recruiter"
 */
export const mapIntentToRole = (intent) => {
    return intent === 'job' ? 'job_seeker' : 'recruiter';
};
