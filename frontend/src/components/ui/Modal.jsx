import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal component with overlay and animation
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - Modal size
 * @param {React.ReactNode} props.children - Modal content
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    className = '',
}) => {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Size styles
    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-fade-in transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
          relative w-full ${sizes[size]}
          bg-white border border-neutral-200
          rounded-xl shadow-float
          animate-scale-in origin-center
          ${className}
        `}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
                        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

/**
 * Modal footer for actions
 */
export const ModalFooter = ({ children, className = '' }) => (
    <div className={`flex items-center justify-end gap-3 mt-6 pt-6 border-t border-neutral-100 ${className}`}>
        {children}
    </div>
);

export default Modal;
