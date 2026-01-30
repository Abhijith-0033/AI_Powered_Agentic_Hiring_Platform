import {
    AlertCircle,
    Bot,
    CheckCircle,
    Clock,
    FileText,
    Sparkles,
    Target,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Select, Toggle } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * AI Actions page
 * Auto-apply, cover letter generation, resume optimization
 */
const AIActions = () => {
    const [autoApply, setAutoApply] = useState(false);
    const [autoApplySettings, setAutoApplySettings] = useState({
        minMatchScore: 80,
        dailyLimit: 10,
        requireApproval: true,
    });

    const aiActions = [
        {
            id: 'cover-letter',
            icon: FileText,
            title: 'Generate Cover Letter',
            description: 'Create a tailored cover letter for a specific job',
            status: 'ready',
            color: 'primary',
        },
        {
            id: 'optimize-resume',
            icon: Sparkles,
            title: 'Optimize Resume',
            description: 'Improve your resume for better ATS compatibility',
            status: 'ready',
            color: 'secondary',
        },
        {
            id: 'match-analysis',
            icon: Target,
            title: 'Match Analysis',
            description: 'Get detailed analysis of job matches',
            status: 'ready',
            color: 'success',
        },
        {
            id: 'skill-gap',
            icon: Zap,
            title: 'Skill Gap Analysis',
            description: 'Identify skills to improve for target roles',
            status: 'beta',
            color: 'warning',
        },
    ];

    const recentActions = [
        {
            id: 1,
            action: 'Cover Letter Generated',
            target: 'Senior Frontend Developer at TechCorp',
            timestamp: '2 hours ago',
            status: 'completed',
        },
        {
            id: 2,
            action: 'Resume Optimized',
            target: 'Full Stack Engineer at StartupXYZ',
            timestamp: '5 hours ago',
            status: 'completed',
        },
        {
            id: 3,
            action: 'Auto-Applied',
            target: 'React Developer at WebAgency',
            timestamp: 'Yesterday',
            status: 'pending',
        },
    ];

    const matchScoreOptions = [
        { value: 70, label: '70% and above' },
        { value: 80, label: '80% and above' },
        { value: 90, label: '90% and above' },
    ];

    const dailyLimitOptions = [
        { value: 5, label: '5 applications per day' },
        { value: 10, label: '10 applications per day' },
        { value: 15, label: '15 applications per day' },
        { value: 20, label: '20 applications per day' },
    ];

    return (
        <DashboardLayout type="user" title="AI Actions">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                        AI-Powered Actions
                    </h2>
                    <p className="text-neutral-500">
                        Let AI assist you in your job search journey.
                    </p>
                </div>

                {/* Auto-Apply Section */}
                <Card className="mb-8 bg-white border-neutral-200 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/20">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle>Auto-Apply Agent</CardTitle>
                                    <CardDescription>
                                        Automatically apply to matching jobs based on your criteria
                                    </CardDescription>
                                </div>
                            </div>
                            <Toggle
                                checked={autoApply}
                                onChange={setAutoApply}
                            />
                        </div>
                    </CardHeader>

                    {autoApply && (
                        <CardContent className="border-t border-neutral-100 pt-6">
                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                                <Select
                                    label="Minimum Match Score"
                                    options={matchScoreOptions}
                                    value={autoApplySettings.minMatchScore}
                                    onChange={(e) => setAutoApplySettings(prev => ({
                                        ...prev,
                                        minMatchScore: parseInt(e.target.value)
                                    }))}
                                />
                                <Select
                                    label="Daily Limit"
                                    options={dailyLimitOptions}
                                    value={autoApplySettings.dailyLimit}
                                    onChange={(e) => setAutoApplySettings(prev => ({
                                        ...prev,
                                        dailyLimit: parseInt(e.target.value)
                                    }))}
                                />
                                <div className="flex items-end">
                                    <Toggle
                                        label="Require Approval"
                                        description="Get notified before each application"
                                        checked={autoApplySettings.requireApproval}
                                        onChange={(checked) => setAutoApplySettings(prev => ({
                                            ...prev,
                                            requireApproval: checked
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Auto-Apply is Active</p>
                                    <p className="text-sm text-amber-600/90">
                                        The agent will automatically apply to jobs matching your criteria.
                                        You can pause this at any time.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Quick Actions Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {aiActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Card key={action.id} hover className="group border-neutral-200">
                                <CardContent className="flex items-start gap-4 p-6">
                                    <div className={`
                    p-3 rounded-xl 
                    ${action.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                                            action.color === 'secondary' ? 'bg-purple-50 text-purple-600' :
                                                action.color === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-amber-50 text-amber-600'}
                    group-hover:scale-110 transition-transform
                  `}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-neutral-900">{action.title}</h3>
                                            {action.status === 'beta' && (
                                                <Badge variant="warning" size="sm">Beta</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-500 mb-4">{action.description}</p>
                                        <Button size="sm" variant="outline" className="border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900">
                                            Run Action
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Recent Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent AI Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {action.status === 'completed' ? (
                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-amber-50 rounded-lg">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-neutral-900">{action.action}</p>
                                            <p className="text-sm text-neutral-500">{action.target}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={action.status === 'completed' ? 'success' : 'warning'} size="sm">
                                            {action.status === 'completed' ? 'Completed' : 'Pending'}
                                        </Badge>
                                        <p className="text-xs text-neutral-400 mt-1">{action.timestamp}</p>
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

export default AIActions;
