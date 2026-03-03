/**
 * LoadingSpinner – uses the custom morphing-square CSS loader
 *
 * @param {'sm' | 'md' | 'lg' | 'xl'} size  - Size of the loader (default: 'lg')
 * @param {string}                    color  - Tailwind text-color class (default: 'text-primary-500')
 * @param {string}                    className - Extra wrapper classes
 */
const LoadingSpinner = ({ size = 'lg', color = 'text-primary-500', className = '' }) => {
    const sizeClass = {
        sm: 'loader-sm',
        md: 'loader-md',
        lg: 'loader-lg',
        xl: 'loader-xl',
    }[size] ?? 'loader-lg';

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`loader ${sizeClass} ${color}`} />
        </div>
    );
};

export default LoadingSpinner;
