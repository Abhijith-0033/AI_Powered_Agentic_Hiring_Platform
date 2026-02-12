import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../ui';
import { LogIn, UserPlus, Briefcase, Users as UsersIcon } from 'lucide-react';

/**
 * Authentication Page - Handles both Login and Registration
 * Single page with toggle between modes
 */
const AuthPage = () => {
    const navigate = useNavigate();
    const { login, register, isAuthenticated, user } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        intent: 'job' // 'job' or 'employee'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already authenticated
    if (isAuthenticated && user) {
        const redirectPath = user.role === 'job_seeker' ? '/user/dashboard' : '/provider/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let userData;

            if (mode === 'register') {
                userData = await register(
                    formData.name,
                    formData.email,
                    formData.password,
                    formData.intent
                );
            } else {
                userData = await login(formData.email, formData.password);
            }

            // Redirect based on role
            const redirectPath = userData.role === 'job_seeker'
                ? '/user/dashboard'
                : '/provider/dashboard';

            navigate(redirectPath, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setFormData({
            name: '',
            email: '',
            password: '',
            intent: 'job'
        });
    };

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-secondary-900/20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" />

            {/* Auth Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-dark-100 mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                        </h1>
                        <p className="text-dark-400">
                            {mode === 'login'
                                ? 'Sign in to your account to continue'
                                : 'Create your account to get started'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field (Register only) */}
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-2">
                                    Full Name
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                                Password
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Intent Field (Register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-3">
                                    What are you looking for?
                                </label>
                                <div className="space-y-3">
                                    {/* Job Seeker Option */}
                                    <label className={`
                                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${formData.intent === 'job'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-dark-700 hover:border-dark-600 bg-dark-800/30'}
                                `}>
                                        <input
                                            type="radio"
                                            name="intent"
                                            value="job"
                                            checked={formData.intent === 'job'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="p-2 rounded-lg bg-primary-500/20">
                                                <Briefcase className="w-5 h-5 text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-100">Looking for a Job</p>
                                                <p className="text-xs text-dark-400">Find your dream career</p>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Recruiter Option */}
                                    <label className={`
                                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${formData.intent === 'employee'
                                            ? 'border-secondary-500 bg-secondary-500/10'
                                            : 'border-dark-700 hover:border-dark-600 bg-dark-800/30'}
                                `}>
                                        <input
                                            type="radio"
                                            name="intent"
                                            value="employee"
                                            checked={formData.intent === 'employee'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-secondary-500 focus:ring-secondary-500"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="p-2 rounded-lg bg-secondary-500/20">
                                                <UsersIcon className="w-5 h-5 text-secondary-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-100">Looking for an Employee</p>
                                                <p className="text-xs text-dark-400">Hire top talent</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={loading}
                            leftIcon={mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        >
                            {loading
                                ? (mode === 'login' ? 'Signing In...' : 'Creating Account...')
                                : (mode === 'login' ? 'Sign In' : 'Create Account')}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dark-700/50"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-dark-800 text-dark-400">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full bg-white text-gray-800 hover:bg-gray-100 border border-gray-200"
                            onClick={() => window.location.href = 'http://localhost:3000/api/auth/google'}
                            leftIcon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            }
                        >
                            Google
                        </Button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-sm text-dark-400 hover:text-primary-400 transition-colors"
                        >
                            {mode === 'login'
                                ? "Don't have an account? "
                                : 'Already have an account? '}
                            <span className="font-semibold text-primary-400">
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
