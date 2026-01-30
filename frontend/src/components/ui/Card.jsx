/**
 * Card component with elevation and refined borders
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional classes
 * @param {boolean} props.hover - Enable hover lift effect
 * @param {boolean} props.flat - Remove shadow for flat style
 * @param {'sm' | 'md' | 'lg' | 'none'} props.padding - Padding size
 */
const Card = ({
    children,
    className = '',
    hover = false,
    flat = false,
    padding = 'md',
    onClick,
    ...props
}) => {
    const paddingSizes = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const baseStyles = `
    bg-white
    border border-neutral-200
    rounded-xl
    transition-all duration-300
  `;

    const hoverStyles = hover
        ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
        : '';

    const shadowStyles = flat
        ? ''
        : 'shadow-sm';

    return (
        <div
            className={`
        ${baseStyles}
        ${shadowStyles}
        ${paddingSizes[padding]}
        ${hoverStyles}
        ${className}
      `}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Card Header component
 */
export const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-6 ${className}`}>
        {children}
    </div>
);

/**
 * Card Title component
 */
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-xl font-semibold text-neutral-900 tracking-tight ${className}`}>
        {children}
    </h3>
);

/**
 * Card Description component
 */
export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-neutral-500 mt-1.5 leading-relaxed ${className}`}>
        {children}
    </p>
);

/**
 * Card Content component
 */
export const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

/**
 * Card Footer component
 */
export const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-6 pt-6 border-t border-neutral-100 flex items-center ${className}`}>
        {children}
    </div>
);

export default Card;
