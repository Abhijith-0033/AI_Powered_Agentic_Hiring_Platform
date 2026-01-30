import { Loader2 } from 'lucide-react';

/**
 * Button component with multiple variants and states
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'} props.variant - Button style variant
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
    transition-all duration-200
    focus:outline-none focus-ring
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none
  `;

  // Variant styles (Light Theme)
  const variants = {
    primary: `
      bg-primary-600 text-white
      hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5
      border border-transparent
    `,
    secondary: `
      bg-white text-neutral-700 border border-neutral-200
      hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300
      shadow-sm hover:shadow-md
    `,
    outline: `
      bg-transparent text-primary-600 border border-primary-200
      hover:bg-primary-50 hover:border-primary-300
    `,
    ghost: `
      bg-transparent text-neutral-600
      hover:bg-neutral-100 hover:text-neutral-900
    `,
    danger: `
      bg-white text-error-700 border border-error-200
      hover:bg-error-50 hover:border-error-300 hover:shadow-sm
    `,
    success: `
      bg-white text-success-700 border border-success-200
      hover:bg-success-50 hover:border-success-300 hover:shadow-sm
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
        <span className="flex-shrink-0 transition-transform group-hover:translate-x-0.5">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
