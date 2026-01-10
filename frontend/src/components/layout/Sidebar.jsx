import {
    Bot,
    Building2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    LayoutDashboard,
    LogOut,
    PlusCircle,
    Search,
    Settings,
    Sparkles,
    User,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar component for dashboard navigation
 * Supports both user and provider navigation
 * 
 * @param {Object} props
 * @param {'user' | 'provider'} props.type - Sidebar type
 */
const Sidebar = ({ type = 'user' }) => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // User navigation items
    const userNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/user/dashboard' },
        { icon: User, label: 'Profile', path: '/user/profile' },
        { icon: FileText, label: 'Resume Tools', path: '/user/resume-tools' },
        { icon: Search, label: 'Job Discovery', path: '/user/jobs' },
        { icon: Bot, label: 'AI Actions', path: '/user/ai-actions' },
        { icon: ClipboardList, label: 'Applications', path: '/user/applications' },
    ];

    // Provider navigation items
    const providerNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/provider/dashboard' },
        { icon: PlusCircle, label: 'Post Job', path: '/provider/post-job' },
        { icon: Users, label: 'Applicants', path: '/provider/applicants' },
        { icon: Sparkles, label: 'AI Tools', path: '/provider/ai-tools' },
        { icon: Building2, label: 'Company', path: '/provider/company' },
    ];

    const navItems = type === 'user' ? userNavItems : providerNavItems;

    const isActive = (path) => location.pathname === path;

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen
        bg-dark-900 border-r border-dark-800
        flex flex-col
        transition-all duration-300 z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-dark-800">
                <Link to="/" className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-dark-100">
                            Hire<span className="text-primary-400">AI</span>
                        </span>
                    )}
                </Link>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <div className="px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${active
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
                                    }
                `}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-400' : ''}`} />
                                {!isCollapsed && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                                {isCollapsed && (
                                    <div className="
                    absolute left-20 bg-dark-800 text-dark-100 
                    px-2 py-1 rounded-md text-sm font-medium
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity whitespace-nowrap
                    shadow-lg border border-dark-700
                  ">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-dark-800 p-3 space-y-1">
                <button className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
          text-dark-400 hover:text-dark-100 hover:bg-dark-800
          transition-colors
        `}>
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
                </button>

                <button className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
          text-dark-400 hover:text-rose-400 hover:bg-rose-500/10
          transition-colors
        `}>
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
