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
          cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-primary-600' : 'bg-neutral-200 hover:bg-neutral-300'}
        `}
            >
                <span
                    className={`
            pointer-events-none inline-block h-5 w-5
            transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
                />
            </button>

            {(label || description) && (
                <div className="flex flex-col cursor-pointer" onClick={() => !disabled && onChange && onChange(!checked)}>
                    {label && (
                        <label
                            htmlFor={toggleId}
                            className="text-sm font-medium text-neutral-900 cursor-pointer select-none"
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-sm text-neutral-500 select-none">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Toggle;
