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
                    className="block text-sm font-medium text-dark-200 mb-1.5"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    id={selectId}
                    className={`
            w-full appearance-none bg-dark-800 border rounded-lg
            text-dark-100 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            px-4 py-2.5 pr-10
            ${error
                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30'
                            : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/30'
                        }
          `}
                    {...props}
                >
                    <option value="" disabled className="text-dark-500">
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            className="bg-dark-800 text-dark-100"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-rose-400">{error}</p>
            )}
        </div>
    );
};

export default Select;
