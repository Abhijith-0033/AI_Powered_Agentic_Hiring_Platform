/**
 * Card component with glass-morphism style
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional classes
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.gradient - Add gradient border
 * @param {'sm' | 'md' | 'lg'} props.padding - Padding size
 */
const Card = ({
    children,
    className = '',
    hover = false,
    gradient = false,
    padding = 'md',
    onClick,
    ...props
}) => {
    const paddingSizes = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const baseStyles = `
    bg-dark-800/50 backdrop-blur-md 
    border border-dark-700/50 
    rounded-xl
    transition-all duration-300
  `;

    const hoverStyles = hover
        ? 'hover:border-dark-600 hover:shadow-lg hover:shadow-dark-900/50 hover:scale-[1.02] cursor-pointer'
        : '';

    const gradientStyles = gradient
        ? 'gradient-border'
        : '';

    return (
        <div
            className={`
        ${baseStyles}
        ${paddingSizes[padding]}
        ${hoverStyles}
        ${gradientStyles}
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
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
);

/**
 * Card Title component
 */
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-dark-100 ${className}`}>
        {children}
    </h3>
);

/**
 * Card Description component
 */
export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-dark-400 mt-1 ${className}`}>
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
    <div className={`mt-4 pt-4 border-t border-dark-700/50 ${className}`}>
        {children}
    </div>
);

export default Card;
