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
    Users,
    Globe,
    Video
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Sidebar component for dashboard navigation
 * Supports both user and provider navigation
 * 
 * @param {Object} props
 * @param {'user' | 'provider'} props.type - Sidebar type
 */
const Sidebar = ({ type = 'user' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // User navigation items
    const userNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/user/dashboard' },
        { icon: User, label: 'Profile', path: '/user/profile' },
        { icon: Search, label: 'Job Discovery', path: '/user/jobs' },
        { icon: Globe, label: 'Jobs in India', path: '/user/jobs-india' },
        { icon: Bot, label: 'AI Actions', path: '/user/ai-actions' },
        { icon: ClipboardList, label: 'Applications', path: '/user/applications' },
        { icon: Video, label: 'Interviews', path: '/user/interviews' },
    ];

    // Provider navigation items
    const providerNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/provider/dashboard' },
        { icon: PlusCircle, label: 'Post Job', path: '/provider/post-job' },
        { icon: Users, label: 'Applicants', path: '/provider/applicants' },
        { icon: Sparkles, label: 'AI Tools', path: '/provider/ai-tools' },
        { icon: Video, label: 'Interviews', path: '/provider/interviews' },
        { icon: Building2, label: 'Company', path: '/provider/company' },
    ];

    const navItems = type === 'user' ? userNavItems : providerNavItems;

    const isActive = (path) => location.pathname === path;

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen
        bg-white border-r border-neutral-200
        flex flex-col
        transition-all duration-300 z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-100">
                <Link to="/" className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-neutral-900 tracking-tight">
                            Hire<span className="text-primary-600">AI</span>
                        </span>
                    )}
                </Link>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200">
                <div className="px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 group relative
                  ${active
                                        ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                                    }
                `}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                                {!isCollapsed && (
                                    <span className="text-sm">{item.label}</span>
                                )}
                                {isCollapsed && (
                                    <div className="
                    absolute left-16 bg-neutral-900 text-white 
                    px-2.5 py-1.5 rounded-md text-xs font-medium
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity whitespace-nowrap z-50
                    shadow-xl
                  ">
                                        {item.label}
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-neutral-900" />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-neutral-100 p-4 space-y-1 bg-neutral-50/50">
                <button className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl w-full
          text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100
          transition-colors group
        `}>
                    <Settings className="w-5 h-5 flex-shrink-0 text-neutral-400 group-hover:text-neutral-600" />
                    {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl w-full
          text-neutral-500 hover:text-error-600 hover:bg-error-50
          transition-colors group
        `}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 text-neutral-400 group-hover:text-error-500" />
                    {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
