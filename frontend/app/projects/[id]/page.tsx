'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectHeader from '../../components/project/ProjectHeader';
import ProjectOverviewStrip from '../../components/project/ProjectOverviewStrip';
import TaskListView from '../../components/project/TaskListView';
import TaskDetailPanel from '../../components/project/TaskDetailPanel';
import ListDetailPanel from '../../components/project/ListDetailPanel';
import MilestoneDashboard from '../../components/project/MilestoneDashboard';
import MilestoneDetailPanel from '../../components/project/MilestoneDetailPanel';
import CreateListModal from '../../components/project/CreateListModal';
import InviteMemberModal from '../../components/project/InviteMemberModal';
import BoardView from '../../components/project/BoardView';
import TimelineView from '../../components/project/TimelineView';
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
    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('list');
    const [sortBy, setSortBy] = useState<'default' | 'priority' | 'dueDate'>('default');

    const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    // Sync selectedTask when project data updates
    useEffect(() => {
        if (selectedTask && project) {
            const updatedTask = project.lists
                ?.flatMap((l: any) => l.tasks)
                .reduce((found: any, t: any) => {
                    if (found) return found;
                    if (t.id === selectedTask.id) return t;
                    return t.children?.find((c: any) => c.id === selectedTask.id);
                }, null);

            if (updatedTask) {
                setSelectedTask(updatedTask);
            }
        }
    }, [project]);

    const hasPermission = (permissionName: string) => {
        if (!project || !currentMemberId) return false;
        const member = project.members.find((m: any) => m.id === currentMemberId);
        if (!member) return false;
        // Project Manager usually has all permissions, or check isSystem/name
        if (member.role.name === 'Project Manager') return true;

        return member.role.permissions.some((p: any) => p.permission.name === permissionName);
    };

    const processedProject = useMemo(() => {
        if (!project) return null;
        if (sortBy === 'default') return project;

        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

        const sortedLists = project.lists.map((list: any) => ({
            ...list,
            tasks: [...list.tasks].sort((a: any, b: any) => {
                if (sortBy === 'priority') {
                    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
                }
                if (sortBy === 'dueDate') {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }
                return 0;
            })
        }));

        return { ...project, lists: sortedLists };
    }, [project, sortBy]);

    const fetchProjectData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.project) {
                setProject(data.project);
                if (data.currentMemberId) {
                    setCurrentMemberId(data.currentMemberId);
                }
            }
        } catch (error) {
            console.error('Fetch project error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMember = async (email: string, roleId: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/projects/${projectId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, roleId })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to invite member');
        }

        await fetchProjectData(true);
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
                        onCreateList={() => setIsCreateListModalOpen(true)}
                        onInviteMember={() => setIsInviteModalOpen(true)}
                        canInvite={hasPermission('manage_members')}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
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
                                            lists={processedProject.lists}
                                            projectId={projectId}
                                            project={project}
                                            onTaskClick={(task: any) => setSelectedTask(task)}
                                            onListClick={(listId: string) => setSelectedListId(listId)}
                                            onRefresh={() => fetchProjectData(true)}
                                        />
                                    </motion.div>
                                )}

                                {activeView === 'board' && (
                                    <motion.div
                                        key="board"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full"
                                    >
                                        <BoardView
                                            tasks={processedProject.lists.flatMap((l: any) => l.tasks)}
                                            projectId={projectId}
                                            onTaskClick={(task: any) => setSelectedTask(task)}
                                            onRefresh={() => fetchProjectData(true)}
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
                                            onRefresh={() => fetchProjectData(true)}
                                            projectTasks={processedProject.lists.flatMap((list: any) => list.tasks)}
                                            onMilestoneClick={(milestone: any) => setSelectedMilestone(milestone)}
                                        />
                                    </motion.div>
                                )}

                                {activeView === 'timeline' && (
                                    <motion.div
                                        key="timeline"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full"
                                    >
                                        <TimelineView
                                            tasks={processedProject.lists.flatMap((l: any) => l.tasks)}
                                            milestones={processedProject.milestones || []}
                                            projectId={projectId}
                                            onTaskClick={(task: any) => setSelectedTask(task)}
                                            onRefresh={() => fetchProjectData(true)}
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
                            key="task-detail-panel"
                            task={selectedTask}
                            onClose={() => setSelectedTask(null)}
                            onUpdate={() => fetchProjectData(true)}
                        />
                    )}
                    {selectedMilestone && (
                        <MilestoneDetailPanel
                            key="milestone-detail-panel"
                            milestone={selectedMilestone}
                            onClose={() => setSelectedMilestone(null)}
                            onRefresh={() => fetchProjectData(true)}
                        />
                    )}
                    <ListDetailPanel
                        key="list-detail-panel"
                        listId={selectedListId}
                        isOpen={!!selectedListId}
                        onClose={() => setSelectedListId(null)}
                        onRefresh={() => fetchProjectData(true)}
                        projectId={projectId}
                    />
                    <CreateListModal
                        key="create-list-modal"
                        isOpen={isCreateListModalOpen}
                        onClose={() => setIsCreateListModalOpen(false)}
                        projectId={projectId}
                        onSuccess={() => fetchProjectData(true)}
                    />
                    <InviteMemberModal
                        key="invite-member-modal"
                        isOpen={isInviteModalOpen}
                        onClose={() => setIsInviteModalOpen(false)}
                        projectId={projectId}
                        onInvite={handleInviteMember}
                        roles={project?.organization?.roles || []}
                        workspaceMembers={project?.organization?.members || []}
                        projectMembers={project?.members || []}
                    />
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
