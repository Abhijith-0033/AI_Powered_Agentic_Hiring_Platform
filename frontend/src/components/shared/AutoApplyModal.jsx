
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bot, Sliders, Play, Pause, Save } from 'lucide-react';
import { Button } from '../ui';

const AutoApplyModal = ({ isOpen, onClose, active, onToggle }) => {
    const [settings, setSettings] = useState({
        dailyLimit: 15,
        minMatch: 85,
        remoteOnly: true,
        locations: ['San Francisco', 'New York', 'Remote'],
        keywords: ['React', 'Node.js', 'AI']
    });

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center font-sans">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Auto-Apply Agent</h2>
                            <p className="text-sm text-neutral-500">Autonomous Application Bot Configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${active ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
                            <div>
                                <h3 className="font-semibold text-neutral-900">Agent Status: {active ? 'Running' : 'Paused'}</h3>
                                <p className="text-sm text-neutral-500">{active ? 'Currently scanning based on rules below.' : 'Agent is sleeping.'}</p>
                            </div>
                        </div>
                        <Button
                            onClick={onToggle}
                            className={active ? 'bg-neutral-800 hover:bg-neutral-900' : 'bg-green-600 hover:bg-green-700'}
                        >
                            {active ? <><Pause className="w-4 h-4 mr-2" /> Pause Agent</> : <><Play className="w-4 h-4 mr-2" /> Start Agent</>}
                        </Button>
                    </div>

                    <div className="border-t border-neutral-100 pt-4">
                        <h3 className="flex items-center gap-2 font-bold text-neutral-900 mb-4">
                            <Sliders className="w-4 h-4" /> Configuration Rules
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Application Limit</label>
                                <input type="number" value={settings.dailyLimit} onChange={e => setSettings({ ...settings, dailyLimit: e.target.value })} className="w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Min. Match Score %</label>
                                <input type="number" value={settings.minMatch} onChange={e => setSettings({ ...settings, minMatch: e.target.value })} className="w-full p-2 border rounded-md" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Target Locations</label>
                                <div className="p-3 border rounded-md bg-neutral-50 flex flex-wrap gap-2">
                                    {settings.locations.map(l => (
                                        <span key={l} className="bg-white border px-2 py-1 rounded text-sm flex items-center gap-1">
                                            {l} <X className="w-3 h-3 cursor-pointer text-neutral-400 hover:text-red-500" />
                                        </span>
                                    ))}
                                    <button className="text-sm text-blue-600 hover:underline px-2">+ Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={onClose} className="bg-blue-600 text-white hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> Save Settings
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AutoApplyModal;
