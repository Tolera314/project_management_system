'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, Plus, ChevronRight, CheckCircle2,
    Circle, AlertTriangle, Play, Eye, Calendar,
    LayoutGrid, Tag as TagIcon, MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import TaskDetailPanel from '../../components/project/TaskDetailPanel';
import { useToast } from '../../components/ui/Toast';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    projectId: string;
    project: {
        id: string;
        name: string;
    };
    assignees: any[];
}

export default function TasksPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchTasks();
    }, [statusFilter, priorityFilter]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            let workspaceId = localStorage.getItem('selectedWorkspaceId');

            if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
                // Try to wait a bit or fetch current workspace as fallback
                const wsRes = await fetch('http://localhost:4000/workspaces/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const wsData = await wsRes.json();
                if (wsData.workspace) {
                    workspaceId = wsData.workspace.id;
                    localStorage.setItem('selectedWorkspaceId', wsData.workspace.id);
                }
            }

            if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
                setTasks([]);
                setLoading(false);
                return;
            }

            const finalWorkspaceId = workspaceId as string;
            let url = `http://localhost:4000/tasks/search?workspaceId=${finalWorkspaceId}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            showToast('error', 'Error', 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DONE': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'IN_PROGRESS': return <Play size={16} className="text-primary fill-primary/20" />;
            case 'IN_REVIEW': return <Eye size={16} className="text-amber-500" />;
            case 'BLOCKED': return <AlertTriangle size={16} className="text-red-500" />;
            default: return <Circle size={16} className="text-slate-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'text-rose-500 bg-rose-500/10';
            case 'HIGH': return 'text-amber-500 bg-amber-500/10';
            case 'MEDIUM': return 'text-primary bg-primary/10';
            case 'LOW': return 'text-slate-400 bg-surface-secondary';
            default: return 'text-slate-400 bg-surface-secondary';
        }
    };

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">My Tasks</h1>
                        <p className="text-text-secondary text-sm">
                            Manage all your tasks across all projects
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-surface/40 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        >
                            <option value="all" className="bg-surface text-text-primary">All Statuses</option>
                            <option value="TODO" className="bg-surface text-text-primary">To Do</option>
                            <option value="IN_PROGRESS" className="bg-surface text-text-primary">In Progress</option>
                            <option value="IN_REVIEW" className="bg-surface text-text-primary">In Review</option>
                            <option value="DONE" className="bg-surface text-text-primary">Done</option>
                            <option value="BLOCKED" className="bg-surface text-text-primary">Blocked</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-surface/40 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        >
                            <option value="all" className="bg-surface text-text-primary">All Priorities</option>
                            <option value="URGENT" className="bg-surface text-text-primary">Urgent</option>
                            <option value="HIGH" className="bg-surface text-text-primary">High</option>
                            <option value="MEDIUM" className="bg-surface text-text-primary">Medium</option>
                            <option value="LOW" className="bg-surface text-text-primary">Low</option>
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search tasks or projects..."
                        className="w-full bg-surface/40 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Tasks List */}
                <div className="flex-1 bg-surface/10 border border-border rounded-2xl overflow-hidden flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-surface-secondary">
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Task</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Project</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Priority</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-secondary rounded w-48" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-secondary rounded w-32" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-secondary rounded w-20" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-secondary rounded w-20" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-surface-secondary rounded w-24" /></td>
                                        </tr>
                                    ))
                                ) : filteredTasks.length > 0 ? (
                                    filteredTasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="group hover:bg-surface-secondary transition-colors cursor-pointer"
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <div className="shrink-0">{getStatusIcon(task.status)}</div>
                                                    <span className={`text-sm font-medium ${task.status === 'DONE' ? 'text-text-secondary opacity-50' : 'text-text-primary'}`}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary/40" />
                                                    <span className="text-xs text-slate-400 group-hover:text-primary transition-colors truncate max-w-[150px]">
                                                        {task.project.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase \${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
                                                    <Calendar size={12} className="opacity-50" />
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <p className="text-text-secondary text-sm">No tasks found matching your criteria.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailPanel
                        task={selectedTask}
                        project={null} // Panel needs to fetch project details itself if passed null, or we fetch it
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => {
                            fetchTasks();
                        }}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
