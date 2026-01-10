import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

/**
 * Table component with sorting and empty state support
 */
export const Table = ({ children, className = '' }) => (
    <div className="overflow-x-auto rounded-xl border border-dark-700">
        <table className={`w-full text-sm ${className}`}>
            {children}
        </table>
    </div>
);

/**
 * Table Head
 */
export const TableHead = ({ children, className = '' }) => (
    <thead className={`bg-dark-800/80 ${className}`}>
        {children}
    </thead>
);

/**
 * Table Body
 */
export const TableBody = ({ children, className = '' }) => (
    <tbody className={`divide-y divide-dark-700/50 ${className}`}>
        {children}
    </tbody>
);

/**
 * Table Row
 */
export const TableRow = ({ children, className = '', hover = true, onClick }) => (
    <tr
        className={`
      ${hover ? 'hover:bg-dark-700/30 transition-colors' : ''}
      ${onClick ? 'cursor-pointer' : ''}
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
      px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider
      ${sortable ? 'cursor-pointer hover:text-dark-100 transition-colors' : ''}
      ${className}
    `}
        onClick={sortable ? onSort : undefined}
    >
        <div className="flex items-center gap-1">
            {children}
            {sortable && (
                <span className="text-dark-500">
                    {sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : sortDirection === 'desc' ? (
                        <ChevronDown className="w-4 h-4" />
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
    <td className={`px-4 py-4 text-dark-200 ${className}`}>
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
        <td colSpan={colSpan} className="px-4 py-12 text-center">
            <div className="flex flex-col items-center gap-2">
                {Icon && <Icon className="w-12 h-12 text-dark-600" />}
                <p className="text-dark-400 font-medium">{message}</p>
                {description && <p className="text-dark-500 text-sm">{description}</p>}
            </div>
        </td>
    </tr>
);

export default Table;
