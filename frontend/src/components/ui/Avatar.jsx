/**
 * Avatar component with image and fallback
 * 
 * @param {Object} props
 * @param {string} props.src - Image source
 * @param {string} props.alt - Alt text
 * @param {string} props.fallback - Fallback initials
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - Size variant
 */
const Avatar = ({ src, alt, fallback, size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
    };

    return (
        <div className={`
            relative inline-flex items-center justify-center 
            rounded-full bg-primary-100 text-primary-700 font-semibold overflow-hidden
            ${sizes[size]} ${className}
        `}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}

            <span className={`${src ? 'hidden' : 'flex'} items-center justify-center w-full h-full absolute inset-0 bg-primary-100`}>
                {fallback || alt?.charAt(0).toUpperCase() || '?'}
            </span>
        </div>
    );
};

export default Avatar;
