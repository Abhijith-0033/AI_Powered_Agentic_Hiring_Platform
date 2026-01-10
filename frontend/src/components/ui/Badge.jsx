/**
 * Badge component for status indicators
 * 
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info' | 'default'} props.variant - Badge color variant
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
    // Variant styles
    const variants = {
        success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        error: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        info: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        default: 'bg-dark-600/50 text-dark-300 border-dark-500/30',
        primary: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    };

    // Dot colors
    const dotColors = {
        success: 'bg-emerald-400',
        warning: 'bg-amber-400',
        error: 'bg-rose-400',
        info: 'bg-sky-400',
        default: 'bg-dark-400',
        primary: 'bg-primary-400',
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
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
            )}
            {children}
        </span>
    );
};

export default Badge;
