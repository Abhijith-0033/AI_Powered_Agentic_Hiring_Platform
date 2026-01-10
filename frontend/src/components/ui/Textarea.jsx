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
                    className="block text-sm font-medium text-dark-200 mb-1.5"
                >
                    {label}
                </label>
            )}

            <textarea
                id={textareaId}
                rows={rows}
                className={`
          w-full bg-dark-800 border rounded-lg
          text-dark-100 placeholder:text-dark-500
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          px-4 py-2.5 resize-none
          ${error
                        ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/30'
                    }
        `}
                {...props}
            />

            {error && (
                <p className="mt-1.5 text-sm text-rose-400">{error}</p>
            )}

            {hint && !error && (
                <p className="mt-1.5 text-sm text-dark-500">{hint}</p>
            )}
        </div>
    );
};

export default Textarea;
