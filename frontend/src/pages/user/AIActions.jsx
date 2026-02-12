import {
    AlertCircle,
    Bot,
    CheckCircle,
    Clock,
    FileText,
    Sparkles,
    Target,
    Zap,
    Settings
} from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Select, Toggle } from '../../components/ui';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * AI Actions page
 * Auto-apply, cover letter generation, resume optimization
 */

import CoverLetterModal from '../../components/shared/CoverLetterModal';
import OptimizeResumeModal from '../../components/shared/OptimizeResumeModal';
import MatchAnalysisModal from '../../components/shared/MatchAnalysisModal';
import SkillGapModal from '../../components/shared/SkillGapModal';
import AutoApplyModal from '../../components/shared/AutoApplyModal';

const AIActions = () => {
    const [autoApplyActive, setAutoApplyActive] = useState(false);

    // Modal States
    const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);
    const [isOptimizeResumeModalOpen, setIsOptimizeResumeModalOpen] = useState(false);
    const [isMatchAnalysisModalOpen, setIsMatchAnalysisModalOpen] = useState(false);
    const [isSkillGapModalOpen, setIsSkillGapModalOpen] = useState(false);
    const [isAutoApplyModalOpen, setIsAutoApplyModalOpen] = useState(false);

    const aiActions = [
        {
            id: 'cover-letter',
            icon: FileText,
            title: 'Generate Cover Letter',
            description: 'Create a tailored cover letter for a specific job',
            status: 'ready',
            color: 'primary',
            action: () => setIsCoverLetterModalOpen(true)
        },
        {
            id: 'optimize-resume',
            icon: Sparkles,
            title: 'Optimize Resume',
            description: 'Improve your resume for better ATS compatibility',
            status: 'ready',
            color: 'secondary',
            action: () => setIsOptimizeResumeModalOpen(true)
        },
        {
            id: 'match-analysis',
            icon: Target,
            title: 'Match Analysis',
            description: 'Get detailed analysis of job matches',
            status: 'ready',
            color: 'success',
            action: () => setIsMatchAnalysisModalOpen(true)
        },
        {
            id: 'skill-gap',
            icon: Zap,
            title: 'Skill Gap Analysis',
            description: 'Identify skills to improve for target roles',
            status: 'beta',
            color: 'warning',
            action: () => setIsSkillGapModalOpen(true)
        }
    ];

    return (
        <DashboardLayout type="user" title="AI Actions">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Auto-Apply Agent Card */}
                <Card className="border-neutral-200 shadow-sm overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-1 h-full ${autoApplyActive ? 'bg-blue-600' : 'bg-neutral-300'}`} />
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl ${autoApplyActive ? 'bg-blue-100' : 'bg-neutral-100'} transition-colors`}>
                                <Bot className={`w-8 h-8 ${autoApplyActive ? 'text-blue-600' : 'text-neutral-500'}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                                    Auto-Apply Agent
                                    {autoApplyActive && <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>}
                                </h2>
                                <p className="text-neutral-500 max-w-lg mt-1">
                                    Automatically apply to matching jobs based on your criteria. The agent runs in the background.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAutoApplyModalOpen(true)}
                                className="hidden md:flex"
                            >
                                <Settings className="w-4 h-4 mr-2" /> Configure
                            </Button>
                            <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200">
                                <span className={`text-sm font-semibold ${autoApplyActive ? 'text-blue-700' : 'text-neutral-500'}`}>
                                    {autoApplyActive ? 'Active' : 'Disabled'}
                                </span>
                                <Toggle
                                    enabled={autoApplyActive}
                                    onChange={setAutoApplyActive}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {aiActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Card key={action.id} hover className="group border-neutral-200 shadow-sm hover:shadow-md transition-all">
                                <CardContent className="flex items-start gap-4 p-6">
                                    <div className={`
                                        p-3 rounded-xl 
                                        ${action.color === 'primary' ? 'bg-indigo-50 text-indigo-600' :
                                            action.color === 'secondary' ? 'bg-purple-50 text-purple-600' :
                                                action.color === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-amber-50 text-amber-600'}
                                        group-hover:scale-110 transition-transform duration-300
                                    `}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-neutral-900">{action.title}</h3>
                                            {action.status === 'beta' && (
                                                <Badge variant="warning" size="sm" className="ml-2">Beta</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{action.description}</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                                            onClick={action.action}
                                        >
                                            Run Action
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Modals */}
                <CoverLetterModal
                    isOpen={isCoverLetterModalOpen}
                    onClose={() => setIsCoverLetterModalOpen(false)}
                />

                <OptimizeResumeModal
                    isOpen={isOptimizeResumeModalOpen}
                    onClose={() => setIsOptimizeResumeModalOpen(false)}
                />

                <MatchAnalysisModal
                    isOpen={isMatchAnalysisModalOpen}
                    onClose={() => setIsMatchAnalysisModalOpen(false)}
                />

                <SkillGapModal
                    isOpen={isSkillGapModalOpen}
                    onClose={() => setIsSkillGapModalOpen(false)}
                />

                <AutoApplyModal
                    isOpen={isAutoApplyModalOpen}
                    active={autoApplyActive}
                    onToggle={() => setAutoApplyActive(!autoApplyActive)}
                    onClose={() => setIsAutoApplyModalOpen(false)}
                />
            </div>
        </DashboardLayout>
    );
};

export default AIActions;
