/**
 * Toggle switch component
 * 
 * @param {Object} props
 * @param {string} props.label - Toggle label
 * @param {string} props.description - Toggle description
 * @param {boolean} props.checked - Toggle state
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Disabled state
 */
const Toggle = ({
    label,
    description,
    checked = false,
    onChange,
    disabled = false,
    className = '',
    id,
}) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <button
                id={toggleId}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange && onChange(!checked)}
                className={`
          relative inline-flex h-6 w-11 flex-shrink-0
          cursor-pointer rounded-full
          transition-colors duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-dark-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-primary-500' : 'bg-dark-600'}
        `}
            >
                <span
                    className={`
            pointer-events-none inline-block h-5 w-5
            transform rounded-full bg-white shadow-lg
            ring-0 transition-transform duration-300 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
            mt-0.5
          `}
                />
            </button>

            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <label
                            htmlFor={toggleId}
                            className="text-sm font-medium text-dark-100 cursor-pointer"
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-sm text-dark-400">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Toggle;
