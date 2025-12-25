'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectHeader from '../../components/project/ProjectHeader';
import ProjectOverviewStrip from '../../components/project/ProjectOverviewStrip';
import TaskListView from '../../components/project/TaskListView';
import TaskDetailPanel from '../../components/project/TaskDetailPanel';
import ListDetailPanel from '../../components/project/ListDetailPanel';
import MilestoneDashboard from '../../components/project/MilestoneDashboard';
import MilestoneDetailPanel from '../../components/project/MilestoneDetailPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('list');

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.project) {
                setProject(data.project);
            }
        } catch (error) {
            console.error('Fetch project error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-text-secondary animate-pulse">Loading project...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!project) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">Project not found</h2>
                        <p className="text-text-secondary">This project might have been deleted or you don't have access.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex h-full relative overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                    <ProjectHeader
                        project={project}
                        activeView={activeView}
                        onViewChange={setActiveView}
                    />

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
                            <ProjectOverviewStrip project={project} />

                            <AnimatePresence mode="wait">
                                {activeView === 'list' && (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <TaskListView
                                            lists={project.lists}
                                            projectId={projectId}
                                            onTaskClick={(task: any) => setSelectedTask(task)}
                                            onListClick={(listId: string) => setSelectedListId(listId)}
                                            onRefresh={fetchProjectData}
                                        />
                                    </motion.div>
                                )}

                                {activeView === 'milestones' && (
                                    <motion.div
                                        key="milestones"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <MilestoneDashboard
                                            projectId={projectId}
                                            onRefresh={fetchProjectData}
                                            projectTasks={project.lists.flatMap((list: any) => list.tasks)}
                                            onMilestoneClick={(milestone: any) => setSelectedMilestone(milestone)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedTask && (
                        <TaskDetailPanel
                            task={selectedTask}
                            onClose={() => setSelectedTask(null)}
                            onUpdate={fetchProjectData}
                        />
                    )}
                    {selectedMilestone && (
                        <MilestoneDetailPanel
                            milestone={selectedMilestone}
                            onClose={() => setSelectedMilestone(null)}
                            onRefresh={fetchProjectData}
                        />
                    )}
                    <ListDetailPanel
                        listId={selectedListId}
                        isOpen={!!selectedListId}
                        onClose={() => setSelectedListId(null)}
                        onRefresh={fetchProjectData}
                        projectId={projectId}
                    />
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
