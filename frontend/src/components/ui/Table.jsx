import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

/**
 * Table component with sorting and empty state support
 */
export const Table = ({ children, className = '' }) => (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm bg-white">
        <table className={`w-full text-sm ${className}`}>
            {children}
        </table>
    </div>
);

/**
 * Table Head
 */
export const TableHead = ({ children, className = '' }) => (
    <thead className={`bg-neutral-50 border-b border-neutral-200 ${className}`}>
        {children}
    </thead>
);

/**
 * Table Body
 */
export const TableBody = ({ children, className = '' }) => (
    <tbody className={`divide-y divide-neutral-100 ${className}`}>
        {children}
    </tbody>
);

/**
 * Table Row
 */
export const TableRow = ({ children, className = '', hover = true, onClick }) => (
    <tr
        className={`
      ${hover ? 'hover:bg-primary-50/30 transition-colors duration-150' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      even:bg-neutral-50/30
      ${className}
    `}
        onClick={onClick}
    >
        {children}
    </tr>
);

/**
 * Table Header Cell
 */
export const TableHeader = ({
    children,
    className = '',
    sortable = false,
    sortDirection,
    onSort,
}) => (
    <th
        className={`
      px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider
      ${sortable ? 'cursor-pointer hover:text-neutral-700 hover:bg-neutral-100 transition-colors select-none' : ''}
      ${className}
    `}
        onClick={sortable ? onSort : undefined}
    >
        <div className="flex items-center gap-1.5">
            {children}
            {sortable && (
                <span className="text-neutral-400">
                    {sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-500" />
                    ) : sortDirection === 'desc' ? (
                        <ChevronDown className="w-4 h-4 text-primary-500" />
                    ) : (
                        <ChevronsUpDown className="w-4 h-4" />
                    )}
                </span>
            )}
        </div>
    </th>
);

/**
 * Table Cell
 */
export const TableCell = ({ children, className = '' }) => (
    <td className={`px-6 py-4 text-neutral-700 whitespace-nowrap ${className}`}>
        {children}
    </td>
);

/**
 * Empty State for Table
 */
export const TableEmpty = ({
    message = 'No data found',
    description = '',
    icon: Icon,
    colSpan = 1
}) => (
    <tr>
        <td colSpan={colSpan} className="px-6 py-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
                {Icon ? (
                    <div className="p-4 rounded-full bg-neutral-50 text-neutral-400">
                        <Icon className="w-8 h-8" />
                    </div>
                ) : null}
                <div className="space-y-1">
                    <p className="text-neutral-900 font-medium text-base">{message}</p>
                    {description && <p className="text-neutral-500 text-sm max-w-sm mx-auto">{description}</p>}
                </div>
            </div>
        </td>
    </tr>
);

export default Table;
