'use client';

import {
    X,
    MoreHorizontal,
    CheckCircle2,
    Circle,
    Clock,
    User as UserIcon,
    AlertTriangle,
    AlignLeft,
    Calendar,
    Flag,
    MessageSquare,
    Paperclip,
    History,
    ChevronRight,
    Play,
    LayoutGrid,
    Plus,
    Target,
    Link as LinkIcon,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Fragment, useRef } from 'react';
import DependencyModal from '../shared/DependencyModal';
import InlineAssigneeSelector from './InlineAssigneeSelector';

interface TaskDetailPanelProps {
    task: any;
    onClose: () => void;
    onUpdate: () => void;
}

export default function TaskDetailPanel({ task: initialTask, onClose, onUpdate }: TaskDetailPanelProps) {
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
    const [dependencies, setDependencies] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const subtaskInputRef = useRef<HTMLInputElement>(null);

    const [currentMemberRole, setCurrentMemberRole] = useState<any>(null);

    useEffect(() => {
        fetchTaskDetails();
    }, [initialTask.id]);

    useEffect(() => {
        if (task && initialTask) {
            setTask((prev: any) => ({
                ...prev,
                priority: initialTask.priority,
                startDate: initialTask.startDate,
                dueDate: initialTask.dueDate,
                status: initialTask.status,
                assignees: initialTask.assignees
            }));
        }
    }, [initialTask.priority, initialTask.startDate, initialTask.dueDate, initialTask.status, initialTask.assignees]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const [taskRes, depRes, membersRes] = await Promise.all([
                fetch(`http://localhost:4000/tasks/${initialTask.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:4000/dependencies/${initialTask.id}?type=TASK`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:4000/projects/${initialTask.projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const taskData = await taskRes.json();
            const depData = await depRes.json();
            const projectData = await membersRes.json();

            if (taskData.task) setTask(taskData.task);
            if (depData.dependencies) setDependencies(depData.dependencies);
            if (projectData.project) {
                setProject(projectData.project);
                setProjectMembers(projectData.project.members || []);
                setOrganizationMembers(projectData.project.organization?.members || []);
            }
            if (projectData.currentMemberRole) setCurrentMemberRole(projectData.currentMemberRole);
        } catch (error) {
            console.error('Fetch task details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permissionName: string) => {
        if (!currentMemberRole) return false;
        if (currentMemberRole.name === 'Project Manager') return true;
        return currentMemberRole.permissions?.some((p: any) => p.permission.name === permissionName);
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            // Optimistic update
            setTask((prev: any) => ({ ...prev, status: newStatus }));
            onUpdate();

            await fetch(`http://localhost:4000/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error('Update status error:', error);
            fetchTaskDetails(); // Revert on error
        }
    };

    const handleUpdateTask = async (updates: any) => {
        try {
            const token = localStorage.getItem('token');
            // Optimistic update
            setTask((prev: any) => ({ ...prev, ...updates }));
            onUpdate();

            await fetch(`http://localhost:4000/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('Update task error:', error);
            fetchTaskDetails(); // Revert on error
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/tasks/${task.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                onClose();
                onUpdate();
            }
        } catch (error) {
            console.error('Delete task error:', error);
        }
    };

    const handlePostComment = async () => {
        if (!comment.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/tasks/${task.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: comment })
            });

            if (res.ok) {
                setComment('');
                fetchTaskDetails();
            }
        } catch (error) {
            console.error('Post comment error:', error);
        }
    };

    const handleCreateSubtask = async (e?: React.KeyboardEvent) => {
        if (e && e.key !== 'Enter') return;
        if (!newSubtaskTitle.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newSubtaskTitle,
                    projectId: task.projectId,
                    listId: task.listId,
                    parentId: task.id
                })
            });

            if (res.ok) {
                setNewSubtaskTitle('');
                fetchTaskDetails();
                onUpdate();
                setTimeout(() => subtaskInputRef.current?.focus(), 0);
            }
        } catch (error) {
            console.error('Create subtask error:', error);
        }
    };

    const handleToggleSubtask = async (subtask: any) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';

            // Optimistic update for subtask
            setTask((prev: any) => ({
                ...prev,
                children: prev.children.map((c: any) => c.id === subtask.id ? { ...c, status: newStatus } : c)
            }));
            onUpdate();

            await fetch(`http://localhost:4000/tasks/${subtask.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error('Toggle subtask error:', error);
            fetchTaskDetails();
        }
    };

    const handleAddAssignee = async (memberIdOrString: string) => {
        try {
            const token = localStorage.getItem('token');
            let targetMemberId = memberIdOrString;
            if (!targetMemberId) return;

            // 1. Optimistic update (Move this to the top for speed)
            const memberData = projectMembers?.find((m: any) => m.id === targetMemberId) ||
                organizationMembers?.find((m: any) => m.id === targetMemberId) ||
                organizationMembers?.find((m: any) => `org_${m.id}` === targetMemberId);

            const tempAssignee = {
                id: `temp-${Date.now()}`,
                projectMemberId: targetMemberId.startsWith('org_') ? null : targetMemberId,
                projectMember: memberData?.organizationMember
                    ? memberData
                    : { organizationMember: memberData ?? { user: { firstName: '...', lastName: '' } } }
            };

            setTask((prev: any) => ({
                ...prev,
                assignees: [...(prev.assignees || []), tempAssignee]
            }));
            onUpdate();

            let body: any = { projectMemberId: targetMemberId };

            // Handle Workspace Member not in project yet
            if (targetMemberId.startsWith('org_')) {
                const orgMemberId = targetMemberId.split('_')[1];
                body = { organizationMemberId: orgMemberId };
            }
            // Handle Invited User
            else if (targetMemberId.startsWith('inv_')) {
                const isInv = memberIdOrString.startsWith('inv_');
                const targetId = memberIdOrString.split('_')[1];
                const email = isInv
                    ? project?.invitations?.find((inv: any) => inv.id === targetId)?.email
                    : organizationMembers.find((m: any) => m.id === targetId)?.user.email;

                if (!email) {
                    fetchTaskDetails(); // Revert optimistic update
                    return;
                }

                const rolesRes = await fetch(`http://localhost:4000/workspaces/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const rolesData = await rolesRes.json();
                const roles = rolesData.workspace.roles;
                const memberRole = roles.find((r: any) => r.name === 'Project Member') || roles[0];

                const inviteRes = await fetch(`http://localhost:4000/projects/${task.projectId}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email, roleId: memberRole.id })
                });

                if (inviteRes.ok) {
                    const data = await inviteRes.json();
                    if (data.id) {
                        body = { projectMemberId: data.id };
                    } else {
                        fetchTaskDetails();
                        return;
                    }
                } else {
                    fetchTaskDetails();
                    return;
                }
            }

            const res = await fetch(`http://localhost:4000/tasks/${task.id}/assignees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setTask((prev: any) => ({
                    ...prev,
                    assignees: [...(prev.assignees || []).filter((a: any) => !a.id.toString().startsWith('temp-')), data.assignee]
                }));
            } else {
                fetchTaskDetails(); // Revert
            }
        } catch (error) {
            console.error('Add assignee error:', error);
        }
    };

    const handleRemoveAssignee = async (projectMemberId: string) => {
        try {
            const token = localStorage.getItem('token');
            // Optimistic update
            setTask((prev: any) => ({
                ...prev,
                assignees: prev.assignees.filter((a: any) => a.projectMemberId !== projectMemberId)
            }));
            onUpdate();

            const res = await fetch(`http://localhost:4000/tasks/${task.id}/assignees/${projectMemberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                fetchTaskDetails(); // Revert
            }
        } catch (error) {
            console.error('Remove assignee error:', error);
            fetchTaskDetails();
        }
    };

    const handleInviteAndAssign = async (email: string) => {
        try {
            const token = localStorage.getItem('token');
            const projectRes = await fetch(`http://localhost:4000/projects/${task.projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const projectData = await projectRes.json();
            const roles = projectData.project.organization.roles;
            const memberRole = roles.find((r: any) => r.name === 'Member') || roles[0];

            if (!memberRole) throw new Error('No role found');

            const inviteRes = await fetch(`http://localhost:4000/projects/${task.projectId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, roleId: memberRole.id })
            });

            if (!inviteRes.ok) {
                const errorArr = await inviteRes.json();
                alert(errorArr.error || 'Failed to invite user');
                return;
            }

            const newMember = await inviteRes.json();
            await handleAddAssignee(newMember.id);
        } catch (error) {
            console.error('Invite and assign error:', error);
        }
    };

    if (loading && !task) {
        return (
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-surface border-l border-white/10 z-50 p-6 flex flex-col gap-6 font-sans"
            >
                <div className="animate-pulse flex flex-col gap-6">
                    <div className="h-8 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-full" />
                    <div className="h-4 bg-white/5 rounded w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-white/5 rounded" />
                        <div className="h-10 bg-white/5 rounded" />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-surface border-l border-white/10 z-50 shadow-2xl flex flex-col font-sans"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleUpdateStatus(task.status === 'DONE' ? 'TODO' : 'DONE')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${task.status === 'DONE'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-white/5 border-white/10 text-text-secondary hover:text-white'
                            }`}
                    >
                        {task.status === 'DONE' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {task.status === 'DONE' ? 'Completed' : 'Mark Complete'}
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold uppercase tracking-wider group hover:bg-indigo-500 hover:text-white transition-all">
                        <Play size={12} className="group-hover:fill-current" />
                        Track Time
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDeleteTask}
                        className="p-2 hover:bg-rose-500/10 rounded-lg text-text-secondary hover:text-rose-500 transition-colors"
                        title="Delete task"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-rose-500 transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-8">
                <div className="space-y-8">
                    {/* Title & Description */}
                    <div className="space-y-4">
                        <div className="group relative">
                            {isEditingTitle ? (
                                <input
                                    autoFocus
                                    className="w-full bg-transparent text-2xl font-bold text-white border-none focus:outline-none focus:ring-0 p-0"
                                    value={task.title}
                                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                                    onBlur={() => {
                                        setIsEditingTitle(false);
                                        handleUpdateTask({ title: task.title });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setIsEditingTitle(false);
                                            handleUpdateTask({ title: task.title });
                                        }
                                    }}
                                />
                            ) : (
                                <h2
                                    onClick={() => setIsEditingTitle(true)}
                                    className="text-2xl font-bold text-white leading-tight cursor-text hover:bg-white/5 rounded-lg px-2 -ml-2 transition-all"
                                >
                                    {task.title}
                                </h2>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <AlignLeft size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Description</span>
                            </div>
                            {isEditingDescription ? (
                                <textarea
                                    autoFocus
                                    className="w-full bg-background border border-primary/50 rounded-xl p-4 text-sm text-white focus:outline-none transition-all min-h-[120px]"
                                    value={task.description || ''}
                                    onChange={(e) => setTask({ ...task, description: e.target.value })}
                                    onBlur={() => {
                                        setIsEditingDescription(false);
                                        handleUpdateTask({ description: task.description });
                                    }}
                                />
                            ) : (
                                <p
                                    onClick={() => setIsEditingDescription(true)}
                                    className="text-sm text-text-secondary leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5 min-h-[100px] hover:border-white/10 transition-all cursor-text"
                                >
                                    {task.description || 'Add a description...'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <div className="space-y-1.5 relative">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center justify-between">
                                <span className="flex items-center gap-2"><UserIcon size={12} /> Assignees</span>
                            </label>

                            <InlineAssigneeSelector
                                currentAssignees={task.assignees || []}
                                projectMembers={projectMembers}
                                organizationMembers={organizationMembers}
                                invitations={project?.invitations || []}
                                onAssign={handleAddAssignee}
                                onUnassign={handleRemoveAssignee}
                                onInvite={handleInviteAndAssign}
                                readOnly={!hasPermission('assign_task')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} /> Start Date
                            </label>
                            <input
                                type="date"
                                className="w-full bg-transparent text-sm text-white font-medium p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]"
                                value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleUpdateTask({ startDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} /> Due Date
                            </label>
                            <input
                                type="date"
                                className="w-full bg-transparent text-sm text-white font-medium p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]"
                                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleUpdateTask({ dueDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Flag size={12} /> Priority
                            </label>
                            <select
                                className="w-full bg-white/5 border border-white/10 text-xs font-bold text-white rounded-full px-3 py-1 outline-none hover:bg-white/10 transition-all appearance-none cursor-pointer"
                                value={task.priority}
                                onChange={(e) => handleUpdateTask({ priority: e.target.value })}
                            >
                                <option value="LOW" className="bg-surface text-white">LOW</option>
                                <option value="MEDIUM" className="bg-surface text-white">MEDIUM</option>
                                <option value="HIGH" className="bg-surface text-white">HIGH</option>
                                <option value="URGENT" className="bg-surface text-white">URGENT</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} /> Status
                            </label>
                            <select
                                className="w-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary rounded-full px-3 py-1 outline-none hover:bg-primary/20 transition-all appearance-none cursor-pointer uppercase tracking-tighter"
                                value={task.status}
                                onChange={(e) => handleUpdateTask({ status: e.target.value })}
                            >
                                <option value="TODO" className="bg-surface text-white">TODO</option>
                                <option value="IN_PROGRESS" className="bg-surface text-white">IN PROGRESS</option>
                                <option value="IN_REVIEW" className="bg-surface text-white">IN REVIEW</option>
                                <option value="DONE" className="bg-surface text-white">DONE</option>
                                <option value="BLOCKED" className="bg-surface text-white">BLOCKED</option>
                            </select>
                        </div>

                        {task.milestone && (
                            <div className="col-span-2 mt-2 pt-4 border-t border-white/5 space-y-1.5">
                                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Target size={12} /> Linked Milestone
                                </label>
                                <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-primary/30 transition-all cursor-default">
                                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <Target size={14} />
                                    </div>
                                    <span className="text-sm text-white font-medium">{task.milestone.name}</span>
                                    <div className="ml-auto text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                        Due {new Date(task.milestone.dueDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subtasks Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <LayoutGrid size={16} className="text-primary" />
                                Subtasks
                            </h3>
                            <span className="text-[10px] font-bold text-text-secondary">{task.children?.length || 0} tasks</span>
                        </div>
                        <div className="space-y-2">
                            {task.children?.map((subtask: any) => (
                                <div key={subtask.id} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-primary/30 transition-all group">
                                    <button
                                        onClick={() => handleToggleSubtask(subtask)}
                                        className="transition-colors"
                                    >
                                        {subtask.status === 'DONE' ? (
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        ) : (
                                            <Circle size={16} className="text-white/20 group-hover:text-primary" />
                                        )}
                                    </button>
                                    <span className={`text-sm flex-1 transition-all ${subtask.status === 'DONE' ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                        {subtask.title}
                                    </span>
                                </div>
                            ))}
                            <div className="relative pt-2 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                    <input
                                        ref={subtaskInputRef}
                                        type="text"
                                        className="w-full bg-white/[0.03] border border-dashed border-white/10 rounded-xl px-9 py-2.5 text-xs text-white placeholder:text-text-secondary/50 focus:border-primary/50 focus:outline-none transition-all"
                                        placeholder="Add a subtask..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={handleCreateSubtask}
                                    />
                                </div>
                                <button
                                    onClick={() => handleCreateSubtask()}
                                    className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-[10px] font-bold text-primary uppercase tracking-widest transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dependencies Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <LinkIcon size={16} className="text-amber-500" />
                                Dependencies
                            </h3>
                            <button
                                onClick={() => setIsDependencyModalOpen(true)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                            >
                                <Plus size={12} /> Add Dependency
                            </button>
                        </div>
                        <div className="space-y-2">
                            {dependencies.map((dep: any) => (
                                <div key={dep.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-amber-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <LinkIcon size={14} />
                                        </div>
                                        <div>
                                            <div className="text-sm text-white font-medium">{dep.source.title}</div>
                                            <div className="text-[10px] text-text-secondary uppercase">{dep.type}</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-text-secondary uppercase bg-white/5 px-2 py-0.5 rounded">
                                        {dep.source.status}
                                    </span>
                                </div>
                            ))}
                            {dependencies.length === 0 && (
                                <div className="text-center p-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">No dependencies linked</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity & Comments Tabs */}
                    <div className="space-y-6 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-6 border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`pb-4 text-xs font-bold tracking-wider transition-all ${activeTab === 'comments' ? 'text-white border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
                            >
                                Comments
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`pb-4 text-xs font-bold tracking-wider transition-all ${activeTab === 'activity' ? 'text-white border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
                            >
                                Activity
                            </button>
                        </div>

                        {/* Comments Tab Content */}
                        {activeTab === 'comments' && (
                            <>
                                {/* Comment Input */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <UserIcon size={14} className="text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <textarea
                                            className="w-full bg-background border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[80px]"
                                            placeholder="Write a comment..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handlePostComment}
                                                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-sans"
                                            >
                                                Post Comment
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Comments */}
                                <div className="space-y-6">
                                    {task.comments?.map((c: any) => (
                                        <div key={c.id} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-full bg-surface-lighter flex items-center justify-center shrink-0 border border-white/5">
                                                {c.createdBy?.firstName?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-white">{c.createdBy?.firstName} {c.createdBy?.lastName}</span>
                                                    <span className="text-[10px] text-text-secondary">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-text-secondary leading-relaxed bg-white/[0.01] p-3 rounded-lg border border-white/5">
                                                    {c.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!task.comments || task.comments.length === 0) && (
                                        <div className="text-center py-8 opacity-50">
                                            <p className="text-xs text-text-secondary italic">No comments yet</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Activity Tab Content */}
                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                {task.activityLogs?.map((log: any) => (
                                    <div key={log.id} className="flex gap-3 text-xs">
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                            <History size={12} className="text-text-secondary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-white">
                                                <span className="font-bold">{log.user.firstName}</span> {log.action.toLowerCase().replace('_', ' ')}
                                            </p>
                                            <span className="text-[10px] text-text-secondary">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!task.activityLogs || task.activityLogs.length === 0) && (
                                    <div className="text-center py-8 opacity-50">
                                        <p className="text-xs text-text-secondary italic">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action */}
            <div className="p-4 border-t border-white/5 bg-surface/50">
                <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4">
                    <History size={12} />
                    Last updated {new Date(task.updatedAt).toLocaleString()}
                </div>
            </div>

            <DependencyModal
                isOpen={isDependencyModalOpen}
                onClose={() => setIsDependencyModalOpen(false)}
                targetId={task.id}
                type="TASK"
                projectId={task.projectId}
                onSuccess={fetchTaskDetails}
            />
        </motion.div>
    );
}
