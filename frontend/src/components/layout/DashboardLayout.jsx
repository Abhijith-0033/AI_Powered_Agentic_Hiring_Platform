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
        <div className="min-h-screen bg-dark-950">
            {/* Sidebar */}
            <Sidebar type={type} />

            {/* Main Content */}
            <div className="pl-64 transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-800">
                    <div className="flex items-center justify-between h-full px-6">
                        {/* Page Title */}
                        <h1 className="text-xl font-semibold text-dark-100">{title}</h1>

                        {/* Header Actions */}
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <button className="p-2 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors">
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Notifications */}
                            <button className="relative p-2 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
                            </button>

                            {/* User Avatar */}
                            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-800 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <div className="animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
