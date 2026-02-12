import { Menu, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../ui/Button';

/**
 * Navbar component for landing and public pages
 * Sticky with backdrop blur effect
 */
const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'For Job Seekers', href: '#job-seekers' },
        { label: 'For Recruiters', href: '#recruiters' },
        { label: 'Pricing', href: '#pricing' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-600 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-neutral-900">
                            Hire<span className="text-primary-600">X</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/user/dashboard">
                            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100">
                                Job Seeker
                            </Button>
                        </Link>
                        <Link to="/provider/dashboard">
                            <Button variant="primary" size="sm">
                                Recruiter Portal
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-b border-neutral-200 animate-slide-up">
                    <div className="px-4 py-4 space-y-3">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="block px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-3 border-t border-neutral-200 flex flex-col gap-2">
                            <Link to="/user/dashboard">
                                <Button variant="secondary" size="sm" fullWidth>
                                    Job Seeker
                                </Button>
                            </Link>
                            <Link to="/provider/dashboard">
                                <Button variant="primary" size="sm" fullWidth>
                                    Recruiter Portal
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
