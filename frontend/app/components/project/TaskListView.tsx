'use client';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Plus,
    Circle,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    User as UserIcon,
    LayoutGrid,
    Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DependencyModal from '../shared/DependencyModal';

interface TaskListViewProps {
    lists: any[];
    projectId: string;
    onTaskClick: (task: any) => void;
    onListClick?: (listId: string) => void;
    onRefresh: () => void;
}

export default function TaskListView({ lists, projectId, onTaskClick, onListClick, onRefresh }: TaskListViewProps) {
    const [collapsedLists, setCollapsedLists] = useState<Record<string, boolean>>({});
    const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListNames, setNewListNames] = useState<Record<string, string>>({});
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [dependencyListId, setDependencyListId] = useState<string | null>(null);

    const toggleList = (listId: string) => {
        setCollapsedLists(prev => ({ ...prev, [listId]: !prev[listId] }));
    };

    const handleCreateList = async () => {
        if (!newListNames['new']) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newListNames['new'],
                    projectId
                })
            });
            if (res.ok) {
                setNewListNames({ ...newListNames, ['new']: '' });
                setIsCreatingList(false);
                onRefresh();
            }
        } catch (error) {
            console.error('Create list error:', error);
        }
    };

    const handleCreateTask = async (listId: string, parentId?: string) => {
        const key = parentId ? `subtask-${parentId}` : listId;
        const title = newListNames[key];
        if (!title) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    projectId,
                    listId,
                    parentId: parentId || null
                })
            });
            if (res.ok) {
                setNewListNames({ ...newListNames, [key]: '' });
                if (parentId) setActiveTaskId(null);
                else setActiveListId(null);
                onRefresh();
            }
        } catch (error) {
            console.error('Create task error:', error);
        }
    };

    const handleToggleStatus = async (task: any) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
            const res = await fetch(`http://localhost:4000/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'URGENT': return { icon: <AlertTriangle size={12} />, color: 'text-rose-500', bg: 'bg-rose-500/10' };
            case 'HIGH': return { icon: <AlertTriangle size={12} />, color: 'text-amber-500', bg: 'bg-amber-500/10' };
            case 'MEDIUM': return { icon: <ChevronRight size={12} />, color: 'text-primary', bg: 'bg-primary/10' };
            default: return { icon: <ChevronRight size={12} />, color: 'text-text-secondary', bg: 'bg-white/5' };
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'DONE') return <CheckCircle2 size={16} className="text-emerald-500" />;
        return <Circle size={16} className="text-text-secondary" />;
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-8 pb-20">
            {lists.map((list) => (
                <div key={list.id} className="space-y-1">
                    {/* List Header */}
                    <div
                        className="flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-white/5 transition-colors group rounded-lg"
                        onClick={() => toggleList(list.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center text-text-secondary group-hover:text-white transition-colors">
                                {collapsedLists[list.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            </div>
                            <h3
                                onClick={(e) => {
                                    if (onListClick) {
                                        e.stopPropagation();
                                        onListClick(list.id);
                                    }
                                }}
                                className="text-sm font-bold text-white uppercase tracking-wider hover:text-primary transition-colors cursor-pointer"
                            >
                                {list.name}
                            </h3>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/5">
                                {list.tasks?.length || 0}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDependencyListId(list.id);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-bold text-text-secondary hover:text-white transition-all"
                            >
                                <LinkIcon size={12} /> Add Dependency
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveListId(list.id); }}
                                className="p-1 hover:bg-white/10 rounded-md text-text-secondary hover:text-white"
                            >
                                <Plus size={14} />
                            </button>
                            <button className="p-1 hover:bg-white/10 rounded-md text-text-secondary hover:text-white">
                                <MoreHorizontal size={14} />
                            </button>
                        </div>
                    </div>

                    {/* List Dependencies */}
                    {list.dependencies && list.dependencies.length > 0 && (
                        <div className="px-10 py-1 flex flex-wrap gap-2 mb-2">
                            {list.dependencies.map((dep: any) => (
                                <div key={dep.id} className="flex items-center gap-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                    <LinkIcon size={8} className="text-amber-500" />
                                    <span className="text-[9px] font-bold text-amber-500 uppercase">{dep.source.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Table View */}
                    <AnimatePresence initial={false}>
                        {!collapsedLists[list.id] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="w-full overflow-x-auto custom-scrollbar">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest min-w-[300px]">Task</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest w-32">Priority</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest w-40">Assignee</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest w-32">Start Date</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest w-32">Due Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {list.tasks?.map((task: any) => (
                                                <>
                                                    <tr
                                                        key={task.id}
                                                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            if (task._count?.children > 0 || activeTaskId === task.id) {
                                                                setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                                                            } else {
                                                                onTaskClick(task);
                                                            }
                                                        }}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1 min-w-[20px]">
                                                                    {(task._count?.children > 0 || activeTaskId === task.id) && (
                                                                        <div className="text-text-secondary">
                                                                            {expandedTasks[task.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleStatus(task);
                                                                    }}
                                                                    className="hover:scale-110 transition-transform shrink-0"
                                                                >
                                                                    {getStatusIcon(task.status)}
                                                                </button>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-sm font-medium transition-colors truncate ${task.status === 'DONE' ? 'text-text-secondary line-through' : 'text-white group-hover:text-primary'}`}>
                                                                        {task.title}
                                                                    </p>
                                                                    {task._count?.children > 0 && (
                                                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium text-text-secondary">
                                                                            <LayoutGrid size={10} />
                                                                            <span>{task._count.children} subtasks</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveTaskId(activeTaskId === task.id ? null : task.id);
                                                                        setExpandedTasks(prev => ({ ...prev, [task.id]: true }));
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                                                                >
                                                                    <Plus size={12} className="text-text-secondary" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {(() => {
                                                                const styles = getPriorityStyles(task.priority);
                                                                return (
                                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${styles.bg} ${styles.color}`}>
                                                                        {styles.icon}
                                                                        <span className="text-[10px] font-bold uppercase tracking-tight">{task.priority}</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-surface-lighter flex items-center justify-center ring-1 ring-white/10">
                                                                    <UserIcon size={12} className="text-text-secondary" />
                                                                </div>
                                                                <span className="text-xs text-text-secondary font-medium">
                                                                    {task.assignees?.[0]?.projectMember?.organizationMember?.user?.firstName || 'Unassigned'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2 text-text-secondary">
                                                                <Calendar size={12} className="opacity-50" />
                                                                <span className="text-xs font-medium">{formatDate(task.startDate)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2 text-text-secondary">
                                                                <Calendar size={12} className="opacity-50" />
                                                                <span className="text-xs font-medium">{formatDate(task.dueDate)}</span>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Subtasks Rendering */}
                                                    {expandedTasks[task.id] && (
                                                        <>
                                                            {task.children?.map((subtask: any) => (
                                                                <tr
                                                                    key={subtask.id}
                                                                    className="bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer transition-colors"
                                                                    onClick={() => onTaskClick(subtask)}
                                                                >
                                                                    <td className="px-4 py-2 pl-12 border-l-2 border-primary/20">
                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleToggleStatus(subtask);
                                                                                }}
                                                                                className="hover:scale-110 transition-transform shrink-0"
                                                                            >
                                                                                {getStatusIcon(subtask.status)}
                                                                            </button>
                                                                            <p className={`text-xs font-medium transition-colors truncate ${subtask.status === 'DONE' ? 'text-text-secondary line-through' : 'text-white/80'}`}>
                                                                                {subtask.title}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2 opacity-50">
                                                                        {/* Subtask priority etc could be added here if needed */}
                                                                    </td>
                                                                    <td colSpan={3} className="px-4 py-2"></td>
                                                                </tr>
                                                            ))}

                                                            {/* Inline Subtask Creation */}
                                                            {activeTaskId === task.id && (
                                                                <tr className="bg-white/[0.01]">
                                                                    <td colSpan={5} className="px-4 py-2 pl-12 border-l-2 border-primary/20">
                                                                        <div className="flex items-center gap-3">
                                                                            <Circle size={14} className="text-white/10" />
                                                                            <input
                                                                                autoFocus
                                                                                placeholder="Subtask name..."
                                                                                className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white py-1"
                                                                                value={newListNames[`subtask-${task.id}`] || ''}
                                                                                onChange={(e) => setNewListNames({ ...newListNames, [`subtask-${task.id}`]: e.target.value })}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') handleCreateTask(list.id, task.id);
                                                                                    if (e.key === 'Escape') setActiveTaskId(null);
                                                                                }}
                                                                            />
                                                                            <button
                                                                                onClick={() => handleCreateTask(list.id, task.id)}
                                                                                className="text-[10px] font-bold text-primary hover:text-primary/80"
                                                                            >
                                                                                Add
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {!activeTaskId && (task.children?.length === 0 || expandedTasks[task.id]) && (
                                                                <tr className="bg-white/[0.01] group">
                                                                    <td colSpan={5} className="px-4 py-1 pl-12 border-l-2 border-primary/10">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveTaskId(task.id);
                                                                                setExpandedTasks(prev => ({ ...prev, [task.id]: true }));
                                                                            }}
                                                                            className="flex items-center gap-2 text-[10px] font-bold text-text-secondary hover:text-primary transition-colors py-1"
                                                                        >
                                                                            <Plus size={12} /> Add subtask
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            ))}

                                            {/* Inline Task Creation Row */}
                                            {activeListId === list.id && (
                                                <tr className="bg-white/[0.01]">
                                                    <td colSpan={5} className="px-4 py-2">
                                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                                                            <Circle size={16} className="text-white/20" />
                                                            <input
                                                                autoFocus
                                                                placeholder="Task name..."
                                                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white py-2"
                                                                value={newListNames[list.id] || ''}
                                                                onChange={(e) => setNewListNames({ ...newListNames, [list.id]: e.target.value })}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleCreateTask(list.id);
                                                                    if (e.key === 'Escape') setActiveListId(null);
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleCreateTask(list.id)}
                                                                    className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-md hover:bg-primary/90"
                                                                >
                                                                    Create
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveListId(null)}
                                                                    className="px-3 py-1 bg-white/5 text-text-secondary text-[10px] font-bold rounded-md hover:bg-white/10"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {!activeListId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveListId(list.id);
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-text-secondary hover:text-primary transition-all group/btn border-t border-white/5 mt-2"
                                    >
                                        <Plus size={16} className="text-white/20 group-hover/btn:text-primary/50" />
                                        <span className="text-xs font-semibold">Add task</span>
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* Create List Button */}
            {isCreatingList ? (
                <div className="p-4 bg-surface/40 border border-primary/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 transition-all mx-2">
                    <input
                        autoFocus
                        placeholder="Enter list name..."
                        className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white mb-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={newListNames['new'] || ''}
                        onChange={(e) => setNewListNames({ ...newListNames, ['new']: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateList();
                            if (e.key === 'Escape') setIsCreatingList(false);
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCreateList}
                            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all"
                        >
                            Create List
                        </button>
                        <button
                            onClick={() => setIsCreatingList(false)}
                            className="px-4 py-2 bg-white/5 text-text-secondary text-xs font-bold rounded-lg hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-2">
                    <button
                        onClick={() => setIsCreatingList(true)}
                        className="flex items-center gap-3 w-full p-4 border border-dashed border-white/10 rounded-2xl text-text-secondary hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                        <Plus size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Create new list</span>
                    </button>
                </div>
            )}

            <DependencyModal
                isOpen={!!dependencyListId}
                onClose={() => setDependencyListId(null)}
                targetId={dependencyListId || ''}
                type="LIST"
                projectId={projectId}
                onSuccess={onRefresh}
            />
        </div>
    );
}
