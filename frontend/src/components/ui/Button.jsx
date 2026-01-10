import { Loader2 } from 'lucide-react';

/**
 * Button component with multiple variants and states
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {React.ReactNode} props.leftIcon - Icon to show on left
 * @param {React.ReactNode} props.rightIcon - Icon to show on right
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    ...props
}) => {
    // Base styles
    const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

    // Variant styles
    const variants = {
        primary: `
      bg-gradient-to-r from-primary-500 to-secondary-500 text-white
      hover:from-primary-400 hover:to-secondary-400
      hover:shadow-lg hover:shadow-primary-500/30
      focus:ring-primary-500
    `,
        secondary: `
      bg-dark-700 text-dark-100 border border-dark-600
      hover:bg-dark-600 hover:border-dark-500
      focus:ring-dark-500
    `,
        outline: `
      bg-transparent text-primary-400 border border-primary-500/50
      hover:bg-primary-500/10 hover:border-primary-400
      focus:ring-primary-500
    `,
        ghost: `
      bg-transparent text-dark-300
      hover:bg-dark-700 hover:text-dark-100
      focus:ring-dark-500
    `,
        danger: `
      bg-rose-500/20 text-rose-400 border border-rose-500/30
      hover:bg-rose-500/30 hover:border-rose-500/50
      focus:ring-rose-500
    `,
    };

    // Size styles
    const sizes = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
        <button
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : leftIcon ? (
                <span className="flex-shrink-0">{leftIcon}</span>
            ) : null}

            <span>{children}</span>

            {rightIcon && !loading && (
                <span className="flex-shrink-0">{rightIcon}</span>
            )}
        </button>
    );
};

export default Button;
