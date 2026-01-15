'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectHeader from '../../components/project/ProjectHeader';
import ProjectOverviewStrip from '../../components/project/ProjectOverviewStrip';
import TaskListView from '../../components/project/TaskListView';
import TaskDetailPanel from '../../components/project/TaskDetailPanel';
import ListDetailPanel from '../../components/project/ListDetailPanel';
import MilestoneDashboard from '../../components/project/MilestoneDashboard';
import MilestoneDetailPanel from '../../components/project/MilestoneDetailPanel';
import CreateListModal from '../../components/project/CreateListModal';
import CreateTaskModal from '../../components/project/CreateTaskModal';
import InviteMemberModal from '../../components/project/InviteMemberModal';
import BoardView from '../../components/project/BoardView';
import TimelineView from '../../components/project/TimelineView';
import ProjectMembersModal from '../../components/project/ProjectMembersModal';
import { AnimatePresence, motion } from 'framer-motion';
import FileList from '../../components/files/FileList';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    systemRole?: string;
}

interface MemberRole {
    id: string;
    name: string;
    permissions: Array<{ permission: { name: string } }>;
}

interface ProjectMember {
    id: string;
    userId: string;
    role: MemberRole;
    user: User;
}

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    startDate?: string;
    assignees?: ProjectMember[];
    children?: Task[];
    projectId: string;
    project: { name: string };
}

interface List {
    id: string;
    name: string;
    tasks: Task[];
    position: number;
}

interface Milestone {
    id: string;
    name: string;
    dueDate: string;
}

interface Project {
    id: string;
    name: string;
    lists: List[];
    members: ProjectMember[];
    milestones?: Milestone[];
    organization?: {
        roles: MemberRole[];
        members: ProjectMember[];
    };
}

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('list');
    const [sortBy, setSortBy] = useState<'default' | 'priority' | 'dueDate'>('default');
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<string | undefined>(undefined);

    const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

    const fetchProjectData = useCallback(async (silent = false) => {
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
    }, [projectId]);

    useEffect(() => {
        fetchProjectData();

        // Remember this project as the last visited for the current workspace
        const selectedId = localStorage.getItem('selectedWorkspaceId');
        if (selectedId && projectId) {
            const lastProjects = JSON.parse(localStorage.getItem('lastProjectsPerWorkspace') || '{}');
            lastProjects[selectedId] = projectId;
            localStorage.setItem('lastProjectsPerWorkspace', JSON.stringify(lastProjects));
        }
    }, [projectId, fetchProjectData]);

    // Sync selectedTask when project data updates
    useEffect(() => {
        if (selectedTask && project) {
            const updatedTask = project.lists
                ?.flatMap((l: List) => l.tasks)
                .reduce((found: Task | null, t: Task) => {
                    if (found) return found;
                    if (t.id === selectedTask.id) return t;
                    return t.children?.find((c: Task) => c.id === selectedTask.id) || null;
                }, null);

            if (updatedTask) {
                setSelectedTask(updatedTask);
            }
        }
    }, [project, selectedTask]);

    const hasPermission = (permissionName: string) => {
        if (!project || !currentMemberId) return false;
        const member = project.members.find((m: ProjectMember) => m.id === currentMemberId);
        if (!member) return false;
        // Project Manager usually has all permissions, or check isSystem/name
        if (member.role.name === 'Project Manager') return true;

        return member.role.permissions.some((p: { permission: { name: string } }) => p.permission.name === permissionName);
    };

    const processedProject = useMemo(() => {
        if (!project) return null;

        const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

        const lists = project.lists.map((list: List) => {
            // 1. Filter Tasks
            let filteredTasks = list.tasks.filter((task: Task) => {
                // Status Filter
                if (filterStatus && task.status !== filterStatus) return false;

                // Assignee Filter
                if (filterAssignee) {
                    if (filterAssignee === 'unassigned') {
                        if (task.assignees && task.assignees.length > 0) return false;
                    } else if (filterAssignee === 'me') {
                        if (!currentMemberId) return false;
                        // Check if current user's org member ID is in task assignees
                        // The task assignees are ProjectMembers. currentMemberId is a ProjectMember ID.
                        const isAssigned = task.assignees?.some((a: ProjectMember) => a.id === currentMemberId);
                        if (!isAssigned) return false;
                    }
                }
                return true;
            });

            // 2. Sort Tasks
            if (sortBy !== 'default') {
                filteredTasks = [...filteredTasks].sort((a: Task, b: Task) => {
                    if (sortBy === 'priority') {
                        return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
                    }
                    if (sortBy === 'dueDate') {
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    }
                    return 0;
                });
            }

            return { ...list, tasks: filteredTasks };
        });

        return { ...project, lists };
    }, [project, sortBy, filterStatus, filterAssignee, currentMemberId]);


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

    const handleUpdateMemberRole = async (memberId: string, roleId: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/projects/${projectId}/members/${memberId}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roleId })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to update role');
        }

        await fetchProjectData(true);
    };

    const handleRemoveMember = async (memberId: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/projects/${projectId}/members/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to remove member');
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
                        <p className="text-text-secondary">This project might have been deleted or you don&apos;t have access.</p>
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
                        onManageMembers={() => setIsMembersModalOpen(true)}
                        canInvite={hasPermission('manage_members')}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        filterStatus={filterStatus}
                        filterAssignee={filterAssignee}
                        onFilterChange={(type, value) => {
                            if (type === 'status') setFilterStatus(value);
                            if (type === 'assignee') setFilterAssignee(value);
                        }}
                    />

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="p-6 md:p-8 max-w-400 mx-auto space-y-8">
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
                                            lists={processedProject!.lists}
                                            projectId={projectId}
                                            project={project}
                                            onTaskClick={(task: Task) => setSelectedTask(task)}
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
                                            tasks={processedProject!.lists.flatMap((l: List) => l.tasks)}
                                            projectId={projectId}
                                            project={project}
                                            onTaskClick={(task: Task) => setSelectedTask(task)}
                                            onRefresh={() => fetchProjectData(true)}
                                            onAddTask={(status) => {
                                                setCreateTaskInitialStatus(status);
                                                setIsCreateTaskModalOpen(true);
                                            }}
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
                                            projectTasks={processedProject!.lists.flatMap((list: List) => list.tasks)}
                                            onMilestoneClick={(milestone: Milestone) => setSelectedMilestone(milestone)}
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
                                            tasks={processedProject!.lists.flatMap((l: List) => l.tasks)}
                                            milestones={processedProject!.milestones || []}
                                            projectId={projectId}
                                            onTaskClick={(task: Task) => setSelectedTask(task)}
                                            onRefresh={() => fetchProjectData(true)}
                                        />
                                    </motion.div>
                                )}

                                {activeView === 'files' && (
                                    <motion.div
                                        key="files"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <FileList projectId={projectId} />
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
                            project={project}
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
                    <CreateTaskModal
                        key="create-task-modal"
                        isOpen={isCreateTaskModalOpen}
                        onClose={() => setIsCreateTaskModalOpen(false)}
                        projectId={projectId}
                        onSuccess={() => fetchProjectData(true)}
                        initialStatus={createTaskInitialStatus}
                        lists={project?.lists || []}
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
                    <ProjectMembersModal
                        key="project-members-modal"
                        isOpen={isMembersModalOpen}
                        onClose={() => setIsMembersModalOpen(false)}
                        project={project}
                        onUpdateRole={handleUpdateMemberRole}
                        onRemoveMember={handleRemoveMember}
                        currentUser={{ id: currentMemberId }} // We need user info more than just member ID for "You" tag, but basic check works
                        roles={(project?.organization?.roles || []).filter((r: MemberRole) =>
                            ['Project Manager', 'Project Member', 'Project Viewer'].includes(r.name)
                        )}
                    />
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
