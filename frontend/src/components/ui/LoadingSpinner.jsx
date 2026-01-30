import { Loader2 } from 'lucide-react';

/**
 * Loading spinner component
 * 
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - Size variant
 * @param {string} props.className - Additional classes
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };

    return (
        <div className="flex items-center justify-center">
            <Loader2
                className={`
                    animate-spin text-primary-500 
                    ${sizes[size]} 
                    ${className}
                `}
            />
        </div>
    );
};

export default LoadingSpinner;
