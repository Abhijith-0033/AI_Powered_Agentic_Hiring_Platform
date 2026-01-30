/**
 * Divider component with optional label text
 * 
 * @param {Object} props
 * @param {string} props.label - Optional text in the middle
 * @param {'left' | 'center' | 'right'} props.align - Label alignment
 */
const Divider = ({ label, align = 'center', className = '' }) => {
    if (!label) {
        return <hr className={`border-t border-neutral-200 my-4 ${className}`} />;
    }

    const alignments = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
    };

    return (
        <div className={`flex items-center py-4 ${alignments[align]} ${className}`}>
            <div className={`flex-grow border-t border-neutral-200 ${align === 'left' ? 'max-w-[20px]' : ''}`}></div>

            <span className="flex-shrink-0 mx-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                {label}
            </span>

            <div className={`flex-grow border-t border-neutral-200 ${align === 'right' ? 'max-w-[20px]' : ''}`}></div>
        </div>
    );
};

export default Divider;
