import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

/**
 * Toast component
 */
const Toast = ({ id, type = 'info', title, message, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-success-500" />,
        error: <AlertCircle className="w-5 h-5 text-error-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
        info: <Info className="w-5 h-5 text-info-500" />,
    };

    const styles = {
        success: 'border-success-100 bg-success-50/50',
        error: 'border-error-100 bg-error-50/50',
        warning: 'border-warning-100 bg-warning-50/50',
        info: 'border-info-100 bg-info-50/50',
    };

    return (
        <div className={`
            flex items-start gap-4 p-4 w-full max-w-sm
            bg-white border rounded-xl shadow-float
            animate-slide-in-right transform transition-all duration-300
            ${styles[type]}
        `}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>

            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className="text-sm font-semibold text-neutral-900 mb-0.5">
                        {title}
                    </h4>
                )}
                <p className="text-sm text-neutral-600 leading-relaxed">
                    {message}
                </p>
            </div>

            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

/**
 * Toast Provider
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-0 right-0 p-6 z-50 flex flex-col gap-3 pointer-events-none">
                <div className="flex flex-col gap-3 pointer-events-auto">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};
