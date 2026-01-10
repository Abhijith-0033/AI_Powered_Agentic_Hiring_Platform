import { Github, Linkedin, Sparkles, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Footer component for landing pages
 */
const Footer = () => {
    const footerLinks = {
        product: [
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'AI Tools', href: '#ai-tools' },
            { label: 'API', href: '#api' },
        ],
        company: [
            { label: 'About', href: '#about' },
            { label: 'Careers', href: '#careers' },
            { label: 'Blog', href: '#blog' },
            { label: 'Press', href: '#press' },
        ],
        resources: [
            { label: 'Documentation', href: '#docs' },
            { label: 'Help Center', href: '#help' },
            { label: 'Privacy Policy', href: '#privacy' },
            { label: 'Terms of Service', href: '#terms' },
        ],
    };

    const socialLinks = [
        { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
        { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
        { icon: Github, href: 'https://github.com', label: 'GitHub' },
    ];

    return (
        <footer className="bg-dark-900 border-t border-dark-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-dark-100">
                                Hire<span className="text-primary-400">AI</span>
                            </span>
                        </Link>
                        <p className="text-dark-400 text-sm mb-4 max-w-xs">
                            AI-powered hiring platform connecting talented job seekers with innovative companies.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-dark-100 hover:bg-dark-700 transition-colors"
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-dark-100 uppercase tracking-wider mb-4">
                            Product
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-dark-400 hover:text-dark-100 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-dark-100 uppercase tracking-wider mb-4">
                            Company
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-dark-400 hover:text-dark-100 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-dark-100 uppercase tracking-wider mb-4">
                            Resources
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-dark-400 hover:text-dark-100 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 border-t border-dark-800">
                    <p className="text-center text-sm text-dark-500">
                        © {new Date().getFullYear()} HireAI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
