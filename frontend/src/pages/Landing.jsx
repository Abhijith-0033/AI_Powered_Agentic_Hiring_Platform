import {
    ArrowRight,
    BarChart3,
    Bot,
    FileText,
    Globe,
    Search,
    Shield,
    Sparkles,
    Target,
    Users,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer, Navbar } from '../components/layout';
import Button from '../components/ui/Button';

/**
 * Landing page component
 * Main marketing page with Hero, Features, CTA sections
 */
const Landing = () => {
    const jobSeekerFeatures = [
        {
            icon: Search,
            title: 'Smart Job Discovery',
            description: 'AI-powered job matching finds opportunities that fit your skills and preferences.',
        },
        {
            icon: FileText,
            title: 'Resume Optimization',
            description: 'Get AI suggestions to optimize your resume for each application.',
        },
        {
            icon: Bot,
            title: 'Auto-Apply Agent',
            description: 'Let our AI agent automatically apply to matching jobs on your behalf.',
        },
        {
            icon: Target,
            title: 'Match Score',
            description: 'See how well you match with each job before applying.',
        },
    ];

    const recruiterFeatures = [
        {
            icon: Users,
            title: 'Applicant Ranking',
            description: 'AI ranks candidates based on skills, experience, and cultural fit.',
        },
        {
            icon: Shield,
            title: 'Fraud Detection',
            description: 'Detect resume inconsistencies and fraudulent claims automatically.',
        },
        {
            icon: Sparkles,
            title: 'Auto-Shortlisting',
            description: 'Save time with intelligent candidate shortlisting.',
        },
        {
            icon: BarChart3,
            title: 'Hiring Analytics',
            description: 'Get insights into your hiring pipeline and performance.',
        },
    ];

    const stats = [
        { value: '500K+', label: 'Jobs Posted' },
        { value: '2M+', label: 'Active Users' },
        { value: '95%', label: 'Match Accuracy' },
        { value: '10x', label: 'Faster Hiring' },
    ];

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-secondary-900/20" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-500" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 mb-8 animate-fade-in">
                            <Sparkles className="w-4 h-4 text-primary-400" />
                            <span className="text-sm font-medium text-primary-300">
                                Powered by Advanced AI & Machine Learning
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dark-100 mb-6 animate-slide-up">
                            Find Your Perfect
                            <span className="block gradient-text">Career Match</span>
                        </h1>

                        <p className="text-xl text-dark-400 mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-100">
                            The AI-powered hiring platform that connects talented professionals with innovative companies through intelligent matching.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
                            <Link to="/user/dashboard">
                                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                    Find Jobs
                                </Button>
                            </Link>
                            <Link to="/provider/dashboard">
                                <Button variant="outline" size="lg">
                                    Start Hiring
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y border-dark-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                                    {stat.value}
                                </p>
                                <p className="text-dark-400 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Job Seeker Features */}
            <section id="job-seekers" className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-dark-100 mb-4">
                            For Job Seekers
                        </h2>
                        <p className="text-lg text-dark-400 max-w-2xl mx-auto">
                            Let AI supercharge your job search and land your dream role faster.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {jobSeekerFeatures.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group p-6 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-primary-500/50 hover:bg-dark-800 transition-all duration-300 hover:scale-[1.02]"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="p-3 rounded-xl bg-primary-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                                        <Icon className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-dark-100 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-dark-400 text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/user/dashboard">
                            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                Explore Job Seeker Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Recruiter Features */}
            <section id="recruiters" className="py-20 bg-dark-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-dark-100 mb-4">
                            For Recruiters
                        </h2>
                        <p className="text-lg text-dark-400 max-w-2xl mx-auto">
                            Hire smarter with AI-powered candidate screening and ranking.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recruiterFeatures.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group p-6 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-secondary-500/50 hover:bg-dark-800 transition-all duration-300 hover:scale-[1.02]"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="p-3 rounded-xl bg-secondary-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                                        <Icon className="w-6 h-6 text-secondary-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-dark-100 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-dark-400 text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/provider/dashboard">
                            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                Explore Recruiter Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-dark-100 mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-dark-400 max-w-2xl mx-auto">
                            Get started in minutes with our simple three-step process.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Create Your Profile',
                                description: 'Upload your resume and let our AI understand your skills and preferences.',
                                icon: FileText,
                            },
                            {
                                step: '02',
                                title: 'Discover Opportunities',
                                description: 'Browse AI-curated job matches tailored specifically to your profile.',
                                icon: Globe,
                            },
                            {
                                step: '03',
                                title: 'Apply & Connect',
                                description: 'Apply with one click or let our AI agent handle applications for you.',
                                icon: Zap,
                            },
                        ].map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.step} className="relative">
                                    <div className="text-7xl font-bold text-dark-800 absolute -top-4 -left-2">
                                        {item.step}
                                    </div>
                                    <div className="relative bg-dark-800/50 border border-dark-700/50 rounded-xl p-6 pt-12">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 w-fit mb-4">
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-dark-100 mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-dark-400">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-12 text-center">
                        {/* Decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to Transform Your Hiring?
                            </h2>
                            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                                Join thousands of companies and job seekers who are already using HireAI to find their perfect match.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/user/dashboard">
                                    <Button variant="secondary" size="lg">
                                        Get Started Free
                                    </Button>
                                </Link>
                                <Link to="/provider/dashboard">
                                    <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                                        Request Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
