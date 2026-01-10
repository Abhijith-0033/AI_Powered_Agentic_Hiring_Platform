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
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        AI-Powered Actions
                    </h2>
                    <p className="text-dark-400">
                        Let AI assist you in your job search journey.
                    </p>
                </div>

                {/* Auto-Apply Section */}
                <Card className="mb-8 gradient-border">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500">
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
                        <CardContent className="border-t border-dark-700 pt-6">
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

                            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-300">Auto-Apply is Active</p>
                                    <p className="text-sm text-amber-400/80">
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
                            <Card key={action.id} hover className="group">
                                <CardContent className="flex items-start gap-4">
                                    <div className={`
                    p-3 rounded-xl 
                    ${action.color === 'primary' ? 'bg-primary-500/20' :
                                            action.color === 'secondary' ? 'bg-secondary-500/20' :
                                                action.color === 'success' ? 'bg-emerald-500/20' :
                                                    'bg-amber-500/20'}
                    group-hover:scale-110 transition-transform
                  `}>
                                        <Icon className={`
                      w-6 h-6
                      ${action.color === 'primary' ? 'text-primary-400' :
                                                action.color === 'secondary' ? 'text-secondary-400' :
                                                    action.color === 'success' ? 'text-emerald-400' :
                                                        'text-amber-400'}
                    `} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-dark-100">{action.title}</h3>
                                            {action.status === 'beta' && (
                                                <Badge variant="warning" size="sm">Beta</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-dark-400 mb-4">{action.description}</p>
                                        <Button size="sm">
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
                                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-700"
                                >
                                    <div className="flex items-center gap-3">
                                        {action.status === 'completed' ? (
                                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                                <Clock className="w-4 h-4 text-amber-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-dark-100">{action.action}</p>
                                            <p className="text-sm text-dark-400">{action.target}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={action.status === 'completed' ? 'success' : 'warning'} size="sm">
                                            {action.status === 'completed' ? 'Completed' : 'Pending'}
                                        </Badge>
                                        <p className="text-xs text-dark-500 mt-1">{action.timestamp}</p>
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
