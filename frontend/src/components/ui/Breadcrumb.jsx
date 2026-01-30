import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = ({ items, showHome = true }) => {
    const location = useLocation();

    // If items are not provided, try to generate them from the path
    const breadcrumbs = items || generateBreadcrumbs(location.pathname);

    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {showHome && (
                    <li className="inline-flex items-center">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-primary-600 transition-colors"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Link>
                    </li>
                )}

                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={index}>
                            <div className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-neutral-400 mx-1" />
                                {isLast ? (
                                    <span className="ml-1 text-sm font-medium text-neutral-900 md:ml-2 truncate max-w-[200px]">
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        to={item.href}
                                        className="ml-1 text-sm font-medium text-neutral-500 hover:text-primary-600 md:ml-2 transition-colors truncate max-w-[200px]"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

// Helper to generate breadcrumbs from path
const generateBreadcrumbs = (pathname) => {
    const paths = pathname.split('/').filter(Boolean);

    // Skip 'dashboard' as it's handled by showHome
    const relevantPaths = paths[0] === 'dashboard' ? paths.slice(1) : paths;

    return relevantPaths.map((path, index) => {
        const href = `/${paths.slice(0, index + (paths[0] === 'dashboard' ? 2 : 1)).join('/')}`;

        // Format label: remove hyphens, capitalize
        const label = path
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

        return { href, label };
    });
};

export default Breadcrumb;
