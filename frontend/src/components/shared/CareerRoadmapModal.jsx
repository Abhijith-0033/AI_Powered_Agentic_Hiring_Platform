import React, { useState, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, BookOpen, Clock, Target, X } from 'lucide-react';
import axios from '../../api/axios';

const CareerRoadmapModal = ({ isOpen, onClose }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [skill, setSkill] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [loading, setLoading] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [error, setError] = useState('');

    const generateRoadmap = async () => {
        if (!skill.trim()) return;
        setLoading(true);
        setError('');
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);

        try {
            const res = await axios.post('/career-roadmap/generate', { skill, currentLevel: level });
            if (res.data.success) {
                const { nodes: apiNodes, edges: apiEdges } = res.data.data;

                const formattedNodes = apiNodes.map(n => ({
                    ...n,
                    type: 'default',
                    draggable: false,
                    selectable: true,
                    style: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: '2px solid #5a67d8',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        minWidth: 220,
                        minHeight: 80,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        lineHeight: '1.4'
                    }
                }));

                const formattedEdges = apiEdges.map(e => ({
                    ...e,
                    animated: true,
                    style: { stroke: '#8b5cf6', strokeWidth: 3 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#8b5cf6',
                        width: 25,
                        height: 25
                    },
                }));

                setNodes(formattedNodes);
                setEdges(formattedEdges);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate roadmap. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">AI Career Roadmap</h2>
                        <p className="text-sm text-neutral-600 mt-1">Visualize your learning journey</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-neutral-600" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Target Skill</label>
                        <input
                            type="text"
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            placeholder="e.g. React Native, Data Science"
                            className="w-full p-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Current Level</label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full p-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <button
                        onClick={generateRoadmap}
                        disabled={loading || !skill}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[38px]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                        Generate
                    </button>
                </div>

                {/* Graph Area */}
                <div className="flex-1 relative">
                    {error && (
                        <div className="absolute top-4 left-4 z-10 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100 shadow-sm">
                            {error}
                        </div>
                    )}

                    {nodes.length === 0 && !loading && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                            <Target className="w-12 h-12 mb-2 opacity-20" />
                            <p>Enter a skill to visualize your learning path</p>
                        </div>
                    )}

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                        fitView
                        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                        minZoom={0.5}
                        maxZoom={1.5}
                        attributionPosition="bottom-left"
                    >
                        <Controls />
                        <MiniMap nodeStrokeColor="#ccc" nodeColor="#eef2ff" />
                        <Background color="#aaa" gap={16} />
                    </ReactFlow>

                    {/* Node Details Drawer */}
                    {selectedNode && (
                        <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-20">
                            <div className="p-4 border-b border-neutral-100 flex justify-between items-start bg-purple-50">
                                <div>
                                    <h3 className="font-bold text-purple-900">{selectedNode.data.label}</h3>
                                    <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{selectedNode.data.estimated_time || 'Self-paced'}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                                    {selectedNode.data.description}
                                </p>

                                {selectedNode.data.resources && selectedNode.data.resources.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" /> Resources
                                        </h4>
                                        <ul className="space-y-2">
                                            {selectedNode.data.resources.map((res, idx) => (
                                                <li key={idx}>
                                                    <a
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:underline block truncate"
                                                    >
                                                        {res.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareerRoadmapModal;
