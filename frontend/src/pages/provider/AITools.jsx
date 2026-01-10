import {
    BarChart3,
    CheckCircle,
    Clock,
    FileText,
    Shield,
    Target,
    Users,
    Zap
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * AI Tools page for recruiters
 * Auto-shortlist, rank candidates, generate JD
 */
const AITools = () => {
    const aiTools = [
        {
            id: 'auto-shortlist',
            icon: Users,
            title: 'Auto-Shortlist',
            description: 'Automatically shortlist candidates based on job requirements and AI analysis',
            status: 'ready',
            color: 'primary',
            stats: '45 candidates processed today',
        },
        {
            id: 'rank-candidates',
            icon: BarChart3,
            title: 'Rank Candidates',
            description: 'AI-powered ranking of applicants based on skills, experience, and culture fit',
            status: 'ready',
            color: 'secondary',
            stats: 'Average ranking accuracy: 94%',
        },
        {
            id: 'generate-jd',
            icon: FileText,
            title: 'Generate Job Description',
            description: 'Create optimized job descriptions using AI to attract the right candidates',
            status: 'ready',
            color: 'success',
            stats: '12 JDs generated this month',
        },
        {
            id: 'skill-match',
            icon: Target,
            title: 'Skill Matching',
            description: 'Deep analysis of candidate skills against job requirements',
            status: 'ready',
            color: 'warning',
            stats: '98% match precision',
        },
        {
            id: 'fraud-detection',
            icon: Shield,
            title: 'Resume Fraud Detection',
            description: 'Detect inconsistencies and potential fraud in candidate resumes',
            status: 'beta',
            color: 'error',
            stats: '3 alerts this week',
        },
        {
            id: 'interview-prep',
            icon: Zap,
            title: 'Interview Questions',
            description: 'Generate tailored interview questions based on job and candidate profile',
            status: 'beta',
            color: 'primary',
            stats: 'Coming soon',
        },
    ];

    const recentActions = [
        {
            id: 1,
            action: 'Auto-Shortlisted Candidates',
            target: 'Senior Frontend Developer',
            count: 8,
            timestamp: '2 hours ago',
            status: 'completed',
        },
        {
            id: 2,
            action: 'Ranked Applicants',
            target: 'Product Manager',
            count: 12,
            timestamp: '5 hours ago',
            status: 'completed',
        },
        {
            id: 3,
            action: 'Generated Job Description',
            target: 'DevOps Engineer',
            timestamp: 'Yesterday',
            status: 'completed',
        },
        {
            id: 4,
            action: 'Fraud Detection Scan',
            target: 'All Applicants',
            count: 45,
            timestamp: 'Yesterday',
            status: 'completed',
        },
    ];

    return (
        <DashboardLayout type="provider" title="AI Tools">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        AI-Powered Hiring Tools
                    </h2>
                    <p className="text-dark-400">
                        Leverage AI to streamline your hiring process and make better decisions.
                    </p>
                </div>

                {/* AI Tools Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {aiTools.map((tool, index) => {
                        const Icon = tool.icon;
                        return (
                            <Card
                                key={tool.id}
                                hover
                                className="group animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <CardContent>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`
                      p-3 rounded-xl 
                      ${tool.color === 'primary' ? 'bg-primary-500/20' :
                                                tool.color === 'secondary' ? 'bg-secondary-500/20' :
                                                    tool.color === 'success' ? 'bg-emerald-500/20' :
                                                        tool.color === 'warning' ? 'bg-amber-500/20' :
                                                            'bg-rose-500/20'}
                      group-hover:scale-110 transition-transform
                    `}>
                                            <Icon className={`
                        w-6 h-6
                        ${tool.color === 'primary' ? 'text-primary-400' :
                                                    tool.color === 'secondary' ? 'text-secondary-400' :
                                                        tool.color === 'success' ? 'text-emerald-400' :
                                                            tool.color === 'warning' ? 'text-amber-400' :
                                                                'text-rose-400'}
                      `} />
                                        </div>
                                        {tool.status === 'beta' && (
                                            <Badge variant="warning" size="sm">Beta</Badge>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-dark-100 mb-2">{tool.title}</h3>
                                    <p className="text-sm text-dark-400 mb-4">{tool.description}</p>

                                    {tool.stats && (
                                        <p className="text-xs text-dark-500 mb-4">{tool.stats}</p>
                                    )}

                                    <Button size="sm" fullWidth>
                                        Run Tool
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Recent AI Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent AI Actions</CardTitle>
                        <CardDescription>
                            Track the history of AI-assisted actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-dark-100">{action.action}</p>
                                                {action.count && (
                                                    <Badge variant="primary" size="sm">{action.count} items</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-dark-400">{action.target}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-dark-500">
                                        <Clock className="w-4 h-4" />
                                        {action.timestamp}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AITools;
