/**
 * Input component with label and focus states
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.success - Success message
 * @param {string} props.hint - Helper text
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 */
const Input = ({
    label,
    error,
    success,
    hint,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                    {label}
                </label>
            )}

            <div className="relative group">
                {leftIcon && (
                    <div className={`
            absolute left-3 top-1/2 -translate-y-1/2 
            ${error ? 'text-error-500' : 'text-neutral-400 group-focus-within:text-primary-500'}
            transition-colors duration-200
          `}>
                        {leftIcon}
                    </div>
                )}

                <input
                    id={inputId}
                    className={`
            w-full bg-white border rounded-lg
            text-neutral-900 placeholder:text-neutral-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'px-4'}
            ${rightIcon ? 'pr-10' : 'px-4'}
            py-2.5
            ${error
                            ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20'
                            : success
                                ? 'border-success-300 focus:border-success-500 focus:ring-success-500/20'
                                : 'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20'
                        }
          `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        {rightIcon}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-error-600 animate-slide-down flex items-center gap-1">
                    {error}
                </p>
            )}

            {success && (
                <p className="mt-1.5 text-sm text-success-600 animate-slide-down">
                    {success}
                </p>
            )}

            {hint && !error && !success && (
                <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
            )}
        </div>
    );
};

export default Input;
