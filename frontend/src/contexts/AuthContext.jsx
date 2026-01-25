import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Check if user is already authenticated on mount
     */
    useEffect(() => {
        checkAuth();
    }, []);

    /**
     * Check authentication status
     */
    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                setLoading(false);
                return;
            }

            // Validate token with backend
            const data = await authAPI.getCurrentUser(token);
            setUser(data.user);
        } catch (err) {
            console.error('Auth check failed:', err);
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login user
     * @param {string} email 
     * @param {string} password 
     */
    const login = async (email, password) => {
        try {
            setError(null);
            const data = await authAPI.login(email, password);

            // Store token
            localStorage.setItem('token', data.token);
            setUser(data.user);

            return data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    /**
     * Register new user
     * @param {string} name 
     * @param {string} email 
     * @param {string} password 
     * @param {string} intent - "job" or "employee"
     */
    const register = async (name, email, password, intent) => {
        try {
            setError(null);
            const data = await authAPI.register(name, email, password, intent);

            // Store token
            localStorage.setItem('token', data.token);
            setUser(data.user);

            return data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    /**
     * Logout user
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
