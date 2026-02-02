import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import Card, { CardContent } from '../../components/ui/Card';

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
            id: 'interview-scheduler',
            icon: Calendar,
            title: 'Interview Scheduler',
            description: 'Automatically schedule interviews for top AI-ranked candidates',
            status: 'ready',
            color: 'secondary',
            stats: 'Schedule top 10 candidates',
        }
    ];

    const navigate = useNavigate();

    const handleRunTool = (toolId) => {
        if (toolId === 'auto-shortlist') {
            navigate('/provider/ai-tools/auto-shortlist');
            return;
        }
        if (toolId === 'interview-scheduler') {
            navigate('/provider/ai-tools/interview-scheduler');
            return;
        }
    }

    return (
        <DashboardLayout type="provider" title="AI Tools">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                        AI-Powered Hiring Tools
                    </h2>
                    <p className="text-neutral-500">
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
                                className="group animate-fade-in shadow-sm hover:shadow-md transition-shadow"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <CardContent>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`
                      p-3 rounded-xl 
                      ${tool.color === 'primary' ? 'bg-primary-50' : 'bg-indigo-50'}
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                                            <Icon className={`
                        w-6 h-6
                        ${tool.color === 'primary' ? 'text-primary-600' : 'text-indigo-600'}
                      `} />
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-neutral-900 mb-2">{tool.title}</h3>
                                    <p className="text-sm text-neutral-500 mb-4">{tool.description}</p>

                                    {tool.stats && (
                                        <p className="text-xs text-neutral-400 mb-4">{tool.stats}</p>
                                    )}

                                    <Button
                                        type="button"
                                        size="sm"
                                        fullWidth
                                        onClick={() => handleRunTool(tool.id)}
                                        variant="outline"
                                        className="hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                                    >
                                        Launch Tool
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AITools;
