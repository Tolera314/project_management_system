'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, CheckSquare, Calendar, Diamond, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    onUseTemplate: (templateId: string) => void;
}

export default function TemplatePreviewModal({
    isOpen,
    onClose,
    templateId,
    onUseTemplate
}: TemplatePreviewModalProps) {
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen && templateId) {
            fetchTemplateDetails();
        }
    }, [isOpen, templateId]);

    const fetchTemplateDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/templates/${templateId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTemplate(data.template);
                // Expand all lists by default
                const listIds = new Set<string>(data.template.lists?.map((l: any) => l.id) || []);
                setExpandedLists(listIds);
            }
        } catch (error) {
            console.error('Failed to fetch template details', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleList = (listId: string) => {
        const newExpanded = new Set(expandedLists);
        if (newExpanded.has(listId)) {
            newExpanded.delete(listId);
        } else {
            newExpanded.add(listId);
        }
        setExpandedLists(newExpanded);
    };

    const handleUseTemplate = () => {
        onUseTemplate(templateId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Template Mode Banner */}
                            <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Layout size={16} />
                                    <span className="font-medium text-sm">Template Preview - Read Only</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-surface/10 rounded transition-colors text-purple-600 dark:text-purple-400 hover:text-text-primary"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-24 bg-background/50 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : template ? (
                                    <div className="space-y-6">
                                        {/* Template Header */}
                                        <div>
                                            <h2 className="text-2xl font-bold text-text-primary mb-2">{template.name}</h2>
                                            <p className="text-text-secondary text-sm">{template.description || 'No description provided'}</p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-4 text-xs font-medium text-text-secondary">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckSquare size={14} />
                                                    <span>{template._count?.tasks || 0} Tasks</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Layout size={14} />
                                                    <span>{template.lists?.length || 0} Lists</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Diamond size={14} />
                                                    <span>{template._count?.milestones || 0} Milestones</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lists & Tasks */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Structure</h3>

                                            {template.lists && template.lists.length > 0 ? (
                                                template.lists.map((list: any) => (
                                                    <div key={list.id} className="bg-surface-secondary border border-border rounded-xl overflow-hidden">
                                                        {/* List Header */}
                                                        <button
                                                            onClick={() => toggleList(list.id)}
                                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-foreground/5 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <svg
                                                                    className={`w-4 h-4 text-text-secondary transition-transform ${expandedLists.has(list.id) ? 'rotate-90' : ''}`}
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                                <span className="font-medium text-text-primary">{list.name}</span>
                                                            </div>
                                                            <span className="text-xs text-text-secondary">
                                                                {list.tasks?.filter((t: any) => !t.parentId).length || 0} tasks
                                                            </span>
                                                        </button>

                                                        {/* Tasks */}
                                                        {expandedLists.has(list.id) && list.tasks && (
                                                            <div className="px-4 pb-3 space-y-1">
                                                                {list.tasks.filter((t: any) => !t.parentId).map((task: any) => (
                                                                    <div key={task.id} className="pl-6 py-2 border-l-2 border-border">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <div className="text-sm text-white/80">{task.title}</div>
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${task.status === 'DONE' ? 'bg-green-500/20 text-green-400' :
                                                                                task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                                                                    task.status === 'BLOCKED' ? 'bg-red-500/20 text-red-400' :
                                                                                        task.status === 'IN_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                            'bg-slate-500/20 text-slate-400'
                                                                                }`}>
                                                                                {task.status || 'TODO'}
                                                                            </span>
                                                                        </div>
                                                                        {task.description && (
                                                                            <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                                                                                {task.description}
                                                                            </div>
                                                                        )}
                                                                        {/* Subtasks */}
                                                                        {task.children && task.children.length > 0 && (
                                                                            <div className="ml-4 mt-2 space-y-1.5">
                                                                                {task.children.map((subtask: any) => (
                                                                                    <div key={subtask.id} className="flex items-center justify-between gap-4 pl-3 border-l border-white/5">
                                                                                        <div className="text-xs text-text-secondary/70">
                                                                                            ↳ {subtask.title}
                                                                                        </div>
                                                                                        <span className="text-[9px] text-text-secondary/50 font-bold uppercase">
                                                                                            {subtask.status || 'TODO'}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-text-secondary text-sm italic">
                                                    No lists in this template
                                                </div>
                                            )}
                                        </div>

                                        {/* Milestones */}
                                        {template.milestones && template.milestones.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Milestones</h3>
                                                <div className="space-y-2">
                                                    {template.milestones.map((milestone: any) => (
                                                        <div key={milestone.id} className="bg-surface-secondary border border-border rounded-lg px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Diamond size={14} className="text-purple-500" />
                                                                <span className="font-medium text-text-primary text-sm">{milestone.name}</span>
                                                            </div>
                                                            {milestone.description && (
                                                                <p className="text-xs text-text-secondary mt-1 ml-6">{milestone.description}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-text-secondary">
                                        Template not found
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-surface-secondary">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUseTemplate}
                                    disabled={!template}
                                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Use Template</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
