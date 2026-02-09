import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth(); // We might need to expose a helper or just manually set token

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Store token
            localStorage.setItem('token', token);

            // Decode token to get role (simple decode, or let AuthContext handle it)
            // Ideally use AuthContext to initialize state immediately
            // But for simplicity, we can reload or rely on AuthContext auto-check on mount/focus
            // Let's force a reload to ensure AuthContext picks it up fresh, OR 
            // better: simply redirect to root, and AuthContext will see the token in localStorage and redirect to dashboard.

            window.location.href = '/';
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-dark-100">Authenticating...</h2>
            </div>
        </div>
    );
};

export default OAuthSuccess;
