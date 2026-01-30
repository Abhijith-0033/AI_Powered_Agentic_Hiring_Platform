import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';
import Sidebar from './Sidebar';

/**
 * Dashboard layout wrapper with sidebar and header
 * 
 * @param {Object} props
 * @param {'user' | 'provider'} props.type - Dashboard type
 * @param {string} props.title - Page title
 * @param {React.ReactNode} props.children - Page content
 */
const DashboardLayout = ({ type = 'user', title, children }) => {
    const [sidebarWidth, setSidebarWidth] = useState(256); // 64 = w-64, 80 = w-20

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            {/* Sidebar */}
            <Sidebar type={type} />

            {/* Main Content */}
            <div className="pl-64 transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200">
                    <div className="flex items-center justify-between h-full px-8">
                        {/* Page Title */}
                        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h1>

                        {/* Header Actions */}
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <button className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Notifications */}
                            <button className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full border border-white" />
                            </button>

                            {/* User Avatar */}
                            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100 transition-colors ml-2">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold border border-primary-200">
                                    <User className="w-4 h-4" />
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">
                    <div className="animate-fade-in max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
