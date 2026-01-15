'use client';

import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    MoreHorizontal,
    Plus,
    User as UserIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import UserAvatar from '../shared/UserAvatar';

interface BoardViewProps {
    tasks: any[];
    projectId: string;
    project?: any;
    onTaskClick: (task: any) => void;
    onRefresh: () => void;
    onAddTask?: (status: string) => void;
    isTemplate?: boolean;
}

const COLUMNS: { [key: string]: string } = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'Review',
    DONE: 'Done'
};

const COLUMN_COLORS: { [key: string]: string } = {
    TODO: 'bg-white/5 border-white/5',
    IN_PROGRESS: 'bg-blue-500/10 border-blue-500/20',
    IN_REVIEW: 'bg-amber-500/10 border-amber-500/20',
    DONE: 'bg-emerald-500/10 border-emerald-500/20'
};

const STATUS_Map: { [key: string]: string } = {
    'To Do': 'TODO',
    'In Progress': 'IN_PROGRESS',
    'Review': 'IN_REVIEW',
    'Done': 'DONE'
};

export default function BoardView({ tasks, projectId, project, onTaskClick, onRefresh, onAddTask, isTemplate = false }: BoardViewProps) {
    const [localTasks, setLocalTasks] = useState(tasks);

    // Keep localTasks in sync with props when they change (but not during a drag)
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    const tasksByStatus = useMemo(() => {
        const grouped: { [key: string]: any[] } = {
            TODO: [],
            IN_PROGRESS: [],
            IN_REVIEW: [],
            DONE: []
        };

        const mapStatus = (status: string) => {
            const s = (status || '').toUpperCase().replace(/\s+/g, '_');
            if (grouped[s]) return s;
            if (s === 'TO_DO') return 'TODO';
            if (s === 'REVIEW') return 'IN_REVIEW';
            return 'TODO';
        };

        localTasks.forEach(task => {
            const s = mapStatus(task.status);
            grouped[s].push(task);
        });

        // Sort by position
        Object.keys(grouped).forEach(status => {
            grouped[status].sort((a, b) => (a.position || 0) - (b.position || 0));
        });

        return grouped;
    }, [localTasks]);

    const onDragEnd = async (result: DropResult) => {
        if (isTemplate) return;
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const task = localTasks.find(t => t.id === draggableId);
        if (!task) return;

        const newStatus = destination.droppableId;

        // Optimistic Update: Calculate new position
        const updatedTasks = localTasks.map(t => t.id === draggableId ? { ...t, status: newStatus as any } : t);

        // Function to map status for consistent column matching
        const mapStatus = (status: string) => {
            const s = (status || '').toUpperCase().replace(/\s+/g, '_');
            if (s === 'TODO' || s === 'TO_DO') return 'TODO';
            if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
            if (s === 'IN_REVIEW' || s === 'REVIEW') return 'IN_REVIEW';
            if (s === 'DONE') return 'DONE';
            return 'TODO';
        };

        // Get sorted tasks in target column to find neighbors
        const targetTasks = updatedTasks
            .filter(t => mapStatus(t.status) === newStatus)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        let newPosition = 0;
        if (targetTasks.length <= 1) { // 1 because the task is already in updatedTasks
            newPosition = 1000;
        } else if (destination.index === 0) {
            // Drop at top
            const firstInSource = targetTasks.find(t => t.id !== draggableId);
            newPosition = (firstInSource?.position || 1000) / 2;
        } else {
            // Find neighbors in targetTasks correctly
            const filteredTarget = targetTasks.filter(t => t.id !== draggableId);
            if (destination.index >= filteredTarget.length) {
                // Drop at bottom
                newPosition = (filteredTarget[filteredTarget.length - 1].position || 0) + 1000;
            } else {
                // Drop in between
                const before = filteredTarget[destination.index - 1].position || 0;
                const after = filteredTarget[destination.index].position || 0;
                newPosition = (before + after) / 2;
            }
        }

        const taskInArray = updatedTasks.find(t => t.id === draggableId);
        if (taskInArray) taskInArray.position = newPosition;

        setLocalTasks(updatedTasks);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/tasks/${draggableId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    position: newPosition
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                setLocalTasks(tasks);
                alert(`Failed to move task: ${errorData.error || 'Server error'}`);
            } else {
                onRefresh();
            }
        } catch (error) {
            setLocalTasks(tasks);
            alert('Connection to server failed. Please ensure the backend is running on port 4000.');
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'URGENT': return <AlertTriangle size={14} className="text-rose-500" />;
            case 'HIGH': return <AlertTriangle size={14} className="text-amber-500" />;
            case 'MEDIUM': return <span className="w-2 h-2 rounded-full bg-blue-500" />;
            case 'LOW': return <span className="w-2 h-2 rounded-full bg-slate-500" />;
            default: return null;
        }
    };

    return (
        <div className="h-full overflow-x-auto pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 min-w-[1000px] h-full px-4">
                    {Object.entries(COLUMNS).map(([statusKey, title]) => (
                        <div key={statusKey} className="flex-1 min-w-[280px] flex flex-col h-full">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${statusKey === 'DONE' ? 'bg-emerald-500' :
                                        statusKey === 'IN_PROGRESS' ? 'bg-blue-500' :
                                            statusKey === 'IN_REVIEW' ? 'bg-amber-500' : 'bg-slate-500'
                                        }`} />
                                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">{title}</h3>
                                    <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                        {tasksByStatus[statusKey]?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => onAddTask?.(statusKey)}
                                        className="p-1 hover:bg-foreground/5 rounded text-text-secondary hover:text-primary transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className={`flex-1 rounded-xl p-2 ${COLUMN_COLORS[statusKey]}`}>
                                <Droppable droppableId={statusKey}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`h-full flex flex-col gap-3 transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''
                                                }`}
                                        >
                                            {tasksByStatus[statusKey]?.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...(isTemplate ? {} : provided.dragHandleProps)}
                                                            onClick={() => onTaskClick(task)}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                            }}
                                                            className={`bg-surface p-3 rounded-lg border border-foreground/5 hover:border-primary/50 group cursor-pointer shadow-sm transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/50 rotate-2' : 'hover:-translate-y-1'
                                                                }`}
                                                        >
                                                            {/* Card Content */}
                                                            <div className="flex items-start justify-between mb-2">
                                                                <span className="text-[10px] text-text-secondary font-mono">
                                                                    {task.id.slice(-4).toUpperCase()}
                                                                </span>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button className="p-1 hover:bg-white/10 rounded text-text-secondary">
                                                                        <MoreHorizontal size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <h4 className="text-sm font-medium text-text-primary mb-3 line-clamp-2">
                                                                {task.title}
                                                            </h4>

                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {/* Assignee Avatar */}
                                                                    {!isTemplate ? (
                                                                        task.assignees?.[0]?.projectMember?.organizationMember?.user ? (
                                                                            <UserAvatar
                                                                                userId={task.assignees[0].projectMember.organizationMember.userId} // Assuming this field exists or we might need to adjust based on schema
                                                                                firstName={task.assignees[0].projectMember.organizationMember.user.firstName}
                                                                                lastName={task.assignees[0].projectMember.organizationMember.user.lastName}
                                                                                avatarUrl={task.assignees[0].projectMember.organizationMember.user.avatarUrl}
                                                                                size="sm"
                                                                                className="ring-1 ring-white/10"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-surface-lighter flex items-center justify-center ring-1 ring-white/10" title="Unassigned">
                                                                                <UserIcon size={12} className="text-text-secondary" />
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center border border-dashed border-foreground/10" title="Template Blueprint">
                                                                            <UserIcon size={10} className="text-text-secondary/50" />
                                                                        </div>
                                                                    )}

                                                                    {/* Due Date */}
                                                                    {task.dueDate && (
                                                                        <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${new Date(task.dueDate) < new Date() ? 'text-rose-400 bg-rose-500/10' : 'text-text-secondary bg-white/5'
                                                                            }`}>
                                                                            <Clock size={10} />
                                                                            <span>
                                                                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {/* Subtasks Count */}
                                                                    {task._count?.children > 0 && (
                                                                        <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                                                                            <CheckCircle2 size={10} />
                                                                            <span>{task._count.children}</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Priority */}
                                                                    <div title={`Priority: ${task.priority}`}>
                                                                        {getPriorityIcon(task.priority)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}

// Add CSS keyframes for animations if needed, or rely on Tailwind utility classes
