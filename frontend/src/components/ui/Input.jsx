/**
 * Input component with label and focus states
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.hint - Helper text
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 */
const Input = ({
    label,
    error,
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
                    className="block text-sm font-medium text-dark-200 mb-1.5"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                        {leftIcon}
                    </div>
                )}

                <input
                    id={inputId}
                    className={`
            w-full bg-dark-800 border rounded-lg
            text-dark-100 placeholder:text-dark-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'px-4'}
            ${rightIcon ? 'pr-10' : 'px-4'}
            py-2.5
            ${error
                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30'
                            : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/30'
                        }
          `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
                        {rightIcon}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-rose-400">{error}</p>
            )}

            {hint && !error && (
                <p className="mt-1.5 text-sm text-dark-500">{hint}</p>
            )}
        </div>
    );
};

export default Input;
