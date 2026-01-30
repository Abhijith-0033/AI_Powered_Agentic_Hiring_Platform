/**
 * Textarea component for multi-line input
 * 
 * @param {Object} props
 * @param {string} props.label - Textarea label
 * @param {string} props.error - Error message
 * @param {string} props.hint - Helper text
 * @param {number} props.rows - Number of rows
 */
const Textarea = ({
    label,
    error,
    hint,
    rows = 4,
    className = '',
    id,
    ...props
}) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                    {label}
                </label>
            )}

            <textarea
                id={textareaId}
                rows={rows}
                className={`
          w-full bg-white border rounded-lg
          text-neutral-900 placeholder:text-neutral-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
          px-4 py-3 resize-none
          ${error
                        ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20'
                        : 'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20'
                    }
        `}
                {...props}
            />

            {error && (
                <p className="mt-1.5 text-sm text-error-600 animate-slide-down flex items-center gap-1">
                    {error}
                </p>
            )}

            {hint && !error && (
                <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
            )}
        </div>
    );
};

export default Textarea;
