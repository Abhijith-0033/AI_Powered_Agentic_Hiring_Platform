/**
 * Badge component for status indicators
 * 
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info' | 'default' | 'neutral' | 'primary'} props.variant - Badge color variant
 * @param {'sm' | 'md'} props.size - Badge size
 * @param {boolean} props.dot - Show status dot
 * @param {React.ReactNode} props.children - Badge content
 */
const Badge = ({
    variant = 'default',
    size = 'md',
    dot = false,
    children,
    className = '',
    ...props
}) => {
    // Variant styles (Professional Light Theme)
    const variants = {
        success: 'bg-success-50 text-success-700 border-success-200',
        warning: 'bg-warning-50 text-warning-700 border-warning-200',
        error: 'bg-error-50 text-error-700 border-error-200',
        info: 'bg-info-50 text-info-700 border-info-200',
        default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
        neutral: 'bg-neutral-50 text-neutral-600 border-neutral-200',
        primary: 'bg-primary-50 text-primary-700 border-primary-200',
    };

    // Dot colors
    const dotColors = {
        success: 'bg-success-500',
        warning: 'bg-warning-500',
        error: 'bg-error-500',
        info: 'bg-info-500',
        default: 'bg-neutral-500',
        neutral: 'bg-neutral-500',
        primary: 'bg-primary-500',
    };

    // Size styles
    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        ${variants[variant] || variants.default}
        ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default} animate-pulse`} />
            )}
            {children}
        </span>
    );
};

export default Badge;
