
import React, { useState, useEffect } from 'react';
import { X, Save, Check, AlertCircle, Plus, Trash2, ChevronRight, ChevronDown, Wand2, Type, Layout, List } from 'lucide-react';
import { Button } from '../ui';
import axios from '../../api/axios';

const ResumeEditor = ({ isOpen, onClose, originalText, optimizedData, onSaveSuccess }) => {
    const [resume, setResume] = useState(optimizedData.optimized_resume);
    const [meta, setMeta] = useState({
        matchScore: optimizedData.match_score,
        missingRequired: optimizedData.missing_required_skills,
        missingPreferred: optimizedData.missing_preferred_skills,
        suggestions: optimizedData.suggestions
    });
    const [activeSection, setActiveSection] = useState('summary');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await axios.post('/ai/resume/save-optimized', {
                optimized_resume: resume,
                resume_name: `Optimized_Resume_${new Date().toLocaleDateString()}.pdf`
            });

            if (response.data.success) {
                onSaveSuccess && onSaveSuccess(response.data.data);
                onClose();
            }
        } catch (err) {
            console.error('Save failed:', err);
            setError(err.response?.data?.error || 'Failed to save optimized resume.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (section, field, value) => {
        setResume(prev => ({
            ...prev,
            [section]: value
        }));
    };

    const updateArrayField = (section, index, field, value) => {
        const newArr = [...resume[section]];
        newArr[index] = { ...newArr[index], [field]: value };
        updateField(section, null, newArr);
    };

    const addListItem = (section, template) => {
        setResume(prev => ({
            ...prev,
            [section]: [...prev[section], template]
        }));
    };

    const removeListItem = (section, index) => {
        setResume(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="fixed inset-0 z-[110] bg-neutral-900/95 backdrop-blur-md flex flex-col font-sans overflow-hidden">
            {/* Nav Bar */}
            <div className="h-16 border-b border-neutral-800 bg-neutral-900 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-600 rounded-lg">
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Resume Studio</h2>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded">Match: {meta.matchScore}%</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-neutral-400">Groq AI Optimized</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onClose} className="text-neutral-400 hover:text-white">
                        Discard Changes
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
                    >
                        {isSaving ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Resume
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Guidance & Original */}
                <div className="w-1/4 border-r border-neutral-800 flex flex-col overflow-hidden bg-neutral-900/50">
                    <div className="p-4 border-b border-neutral-800">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                            AI Suggestions
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Summary Suggestion */}
                        <div className="p-4 bg-purple-600/10 border border-purple-600/20 rounded-xl">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Layout className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Summary Insight</span>
                            </div>
                            <p className="text-xs text-neutral-300 leading-relaxed italic line-clamp-4">
                                "{meta.suggestions.improve_summary}"
                            </p>
                        </div>

                        {/* Gaps */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Missing Critical Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {meta.missingRequired.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-red-400/10 text-red-400 rounded text-[10px] border border-red-400/20">{s}</span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> Recommended Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {meta.missingPreferred.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-amber-400/10 text-amber-400 rounded text-[10px] border border-amber-400/20">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-neutral-800">
                            <h4 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">Original Draft</h4>
                            <div className="bg-black/40 p-3 rounded-lg text-[10px] text-neutral-500 font-mono whitespace-pre-wrap leading-tight max-h-[300px] overflow-y-auto">
                                {originalText}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Pane: Editor */}
                <div className="flex-1 flex overflow-hidden bg-neutral-950">
                    {/* Navigation Sidebar */}
                    <div className="w-48 border-r border-neutral-800/50 py-4 bg-neutral-900/20">
                        <nav className="px-3 space-y-1">
                            {[
                                { id: 'summary', name: 'Summary', icon: Type },
                                { id: 'skills', name: 'Key Skills', icon: Layout },
                                { id: 'experience', name: 'Experience', icon: List },
                                { id: 'projects', name: 'Projects', icon: Wand2 },
                                { id: 'education', name: 'Education', icon: Check }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === item.id ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/20' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-12">
                        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl min-h-[1000px] p-12 text-black">
                            {/* Editor UI based on activeSection */}
                            {activeSection === 'summary' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Professional Summary</h3>
                                    <textarea
                                        className="w-full h-[300px] border-none focus:ring-0 text-sm leading-relaxed p-0 resize-none font-serif"
                                        value={resume.summary}
                                        onChange={(e) => updateField('summary', null, e.target.value)}
                                        placeholder="Write a compelling summary..."
                                    />
                                </div>
                            )}

                            {activeSection === 'skills' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Technical Skills</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {resume.skills.map((skill, i) => (
                                            <div key={i} className="group flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg text-sm border border-neutral-200 hover:border-purple-300">
                                                <input
                                                    className="bg-transparent border-none p-0 focus:ring-0 w-auto min-w-[50px]"
                                                    value={skill}
                                                    onChange={(e) => {
                                                        const newSkills = [...resume.skills];
                                                        newSkills[i] = e.target.value;
                                                        updateField('skills', null, newSkills);
                                                    }}
                                                />
                                                <button onClick={() => removeListItem('skills', i)} className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addListItem('skills', 'New Skill')}
                                            className="px-3 py-1.5 border border-dashed border-neutral-300 text-neutral-400 rounded-lg text-sm hover:border-purple-600 hover:text-purple-600 transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-3 h-3" /> Add Skill
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'experience' && (
                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Work Experience</h3>
                                    {resume.experience.map((exp, i) => (
                                        <div key={i} className="relative group p-6 border border-neutral-100 rounded-xl hover:border-purple-200 hover:bg-neutral-50/50 transition-all">
                                            <button
                                                onClick={() => removeListItem('experience', i)}
                                                className="absolute top-4 right-4 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="flex gap-4 mb-4">
                                                <input
                                                    className="flex-1 text-lg font-bold border-none focus:ring-0 p-0"
                                                    value={exp.title}
                                                    onChange={(e) => updateArrayField('experience', i, 'title', e.target.value)}
                                                    placeholder="Job Title"
                                                />
                                                <input
                                                    className="text-right text-sm text-neutral-500 border-none focus:ring-0 p-0"
                                                    value={exp.duration}
                                                    onChange={(e) => updateArrayField('experience', i, 'duration', e.target.value)}
                                                    placeholder="Dates"
                                                />
                                            </div>
                                            <input
                                                className="w-full text-md font-semibold text-purple-600 mb-4 border-none focus:ring-0 p-0"
                                                value={exp.company}
                                                onChange={(e) => updateArrayField('experience', i, 'company', e.target.value)}
                                                placeholder="Company Name"
                                            />
                                            <div className="space-y-2">
                                                {exp.responsibilities.map((resp, ri) => (
                                                    <div key={ri} className="flex gap-3 group/item">
                                                        <span className="text-neutral-400 mt-1.5">•</span>
                                                        <textarea
                                                            className="flex-1 text-sm border-none focus:ring-0 p-0 resize-none min-h-[20px]"
                                                            rows={1}
                                                            value={resp}
                                                            onChange={(e) => {
                                                                const newResps = [...exp.responsibilities];
                                                                newResps[ri] = e.target.value;
                                                                updateArrayField('experience', i, 'responsibilities', newResps);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const newResps = [...exp.responsibilities, 'New responsibility bullet...'];
                                                        updateArrayField('experience', i, 'responsibilities', newResps);
                                                    }}
                                                    className="ml-6 text-xs text-purple-600 font-bold hover:underline"
                                                >
                                                    + Add Bullet Point
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        onClick={() => addListItem('experience', { company: 'Company', title: 'Title', duration: 'Date - Date', responsibilities: ['Key achievement...', 'Project lead...'] })}
                                        className="w-full py-6 border-dashed border-neutral-300 hover:border-purple-600 text-neutral-400 hover:text-purple-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Experience Block
                                    </Button>
                                </div>
                            )}

                            {activeSection === 'projects' && (
                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Key Projects</h3>
                                    {resume.projects.map((proj, i) => (
                                        <div key={i} className="relative group p-6 border border-neutral-100 rounded-xl hover:border-purple-200">
                                            <button
                                                onClick={() => removeListItem('projects', i)}
                                                className="absolute top-4 right-4 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <input
                                                className="w-full text-lg font-bold border-none focus:ring-0 p-0 mb-2"
                                                value={proj.title}
                                                onChange={(e) => updateArrayField('projects', i, 'title', e.target.value)}
                                                placeholder="Project Title"
                                            />
                                            <textarea
                                                className="w-full text-sm text-neutral-600 border-none focus:ring-0 p-0 resize-none mb-4"
                                                value={proj.description}
                                                onChange={(e) => updateArrayField('projects', i, 'description', e.target.value)}
                                                placeholder="Describe the impact and tech stack..."
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {proj.technologies.map((tech, ti) => (
                                                    <span key={ti} className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded text-neutral-500 italic">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        onClick={() => addListItem('projects', { title: 'Personal Project', description: 'Brief description of what you built...', technologies: ['React', 'Node.js'] })}
                                        className="w-full py-6 border-dashed border-neutral-300 text-neutral-400"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Project
                                    </Button>
                                </div>
                            )}

                            {activeSection === 'education' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Education</h3>
                                    <textarea
                                        className="w-full h-[200px] border-none focus:ring-0 text-md p-0 resize-none font-serif"
                                        value={resume.education}
                                        onChange={(e) => updateField('education', null, e.target.value)}
                                        placeholder="University Name, Degree, Graduation Year..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="absolute bottom-20 right-6 p-4 bg-red-600 text-white rounded-lg shadow-2xl animate-in slide-in-from-bottom flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

export default ResumeEditor;
