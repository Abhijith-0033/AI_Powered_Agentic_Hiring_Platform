import { ChevronDown } from 'lucide-react';

/**
 * Select dropdown component
 * 
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {Array} props.options - Array of { value, label } options
 * @param {string} props.error - Error message
 * @param {string} props.placeholder - Placeholder text
 */
const Select = ({
    label,
    options = [],
    error,
    placeholder = 'Select an option',
    className = '',
    id,
    ...props
}) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                    {label}
                </label>
            )}

            <div className="relative group">
                <select
                    id={selectId}
                    className={`
            w-full appearance-none bg-white border rounded-lg
            text-neutral-900 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
            px-4 py-2.5 pr-10
            ${error
                            ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20'
                            : 'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-primary-500/20'
                        }
          `}
                    {...props}
                >
                    <option value="" disabled className="text-neutral-400">
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            className="bg-white text-neutral-900 py-2"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none transition-transform group-focus-within:rotate-180 duration-200">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-error-600 animate-slide-down">{error}</p>
            )}
        </div>
    );
};

export default Select;
