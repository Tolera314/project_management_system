'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import ProjectHeader from '../../../components/project/ProjectHeader';
import TaskListView from '../../../components/project/TaskListView';
import TaskDetailPanel from '../../../components/project/TaskDetailPanel';
import CreateListModal from '../../../components/project/CreateListModal';
import BoardView from '../../../components/project/BoardView';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Save, ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function TemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [activeView, setActiveView] = useState('list');
    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);

    useEffect(() => {
        fetchTemplateData();
    }, [templateId]);

    const fetchTemplateData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/templates/${templateId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTemplate(data.project);
            } else {
                router.push('/templates');
            }
        } catch (error) {
            console.error('Failed to fetch template data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTemplate = async (updates: any) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const data = await res.json();
                setTemplate(data.template);
                alert('Template updated successfully');
            }
        } catch (error) {
            console.error('Failed to update template', error);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!template) return null;

    return (
        <DashboardLayout>
            <div className="flex-1 h-full flex flex-col bg-background">
                {/* Template Mode Banner */}
                <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400">
                                <Layout size={18} />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    Template Mode: <span className="text-purple-400">{template.name}</span>
                                </h1>
                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">
                                    Editing Blueprint - Changes affect future projects only
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/templates"
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-white transition-colors"
                            >
                                <ChevronLeft size={16} />
                                Back to Library
                            </Link>
                            <button
                                onClick={() => handleUpdateTemplate({
                                    name: template.name,
                                    description: template.description,
                                    category: template.category,
                                    isPublic: template.isPublic
                                })}
                                className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20"
                            >
                                <Save size={14} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subheader info block */}
                <div className="px-6 py-4 border-b border-white/5 bg-surface/30">
                    <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0">
                            <Info size={16} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-400">Template Logic Overview</p>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                You are editing the structural blueprint of this template. You can add lists, tasks, and milestones.
                                Note that assignees, files, and comments are disabled in template mode as they are project-specific.
                                Dependencies set here will be relative once the template is cloned.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Editor UI - Reusing Project Components */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header Tabs */}
                        <div className="px-6 border-b border-white/5 bg-background flex items-center gap-6 overflow-x-auto">
                            {['Structure', 'Board', 'Timeline', 'Settings'].map(view => (
                                <button
                                    key={view}
                                    onClick={() => setActiveView(view.toLowerCase())}
                                    className={`px-1 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeView === view.toLowerCase()
                                        ? 'border-purple-500 text-purple-400'
                                        : 'border-transparent text-text-secondary hover:text-white'
                                        }`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {activeView === 'structure' && (
                                    <motion.div
                                        key="structure"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="h-full overflow-y-auto p-6"
                                    >
                                        <TaskListView
                                            lists={template.lists || []}
                                            projectId={templateId}
                                            project={template}
                                            onTaskClick={setSelectedTask}
                                            onRefresh={fetchTemplateData}
                                            isTemplate={true}
                                        />
                                    </motion.div>
                                )}
                                {activeView === 'board' && (
                                    <motion.div
                                        key="board"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="h-full overflow-hidden"
                                    >
                                        <BoardView
                                            tasks={template.lists?.flatMap((l: any) => l.tasks) || []}
                                            projectId={templateId}
                                            project={template}
                                            onTaskClick={setSelectedTask}
                                            onRefresh={fetchTemplateData}
                                            isTemplate={true}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Sidebar Panels */}
                    <AnimatePresence>
                        {selectedTask && (
                            <TaskDetailPanel
                                task={selectedTask}
                                project={template}
                                onClose={() => setSelectedTask(null)}
                                onUpdate={fetchTemplateData}
                                isTemplate={true}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <CreateListModal
                isOpen={isCreateListModalOpen}
                onClose={() => setIsCreateListModalOpen(false)}
                projectId={templateId}
                onSuccess={fetchTemplateData}
            />
        </DashboardLayout>
    );
}
