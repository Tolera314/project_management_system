'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Plus, Clock, MoreHorizontal, CheckCircle2, Circle,
    ListFilter, CalendarDays, CalendarRange, Filter,
    Trophy, ChevronDown, Monitor, Search
} from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth,
    endOfMonth, startOfWeek, endOfWeek, isSameMonth,
    isSameDay, addDays, eachDayOfInterval, isToday,
    setHours, setMinutes, eachHourOfInterval,
    addWeeks, subWeeks, startOfDay, endOfDay,
    parseISO, differenceInDays, isWithinInterval,
    subDays
} from 'date-fns';
// ... rest of the file ...
import { useRouter } from 'next/navigation';
import TaskDetailPanel from '../../components/project/TaskDetailPanel';
import { useToast } from '../../components/ui/Toast';
import { socketService } from '../../services/socket.service';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    startDate?: string;
    dueDate?: string;
    projectId: string;
    project: {
        id: string;
        name: string;
        color?: string;
    };
    milestone?: {
        id: string;
        name: string;
    };
}

type CalendarView = 'month' | 'week' | 'day';

export default function CalendarPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('week');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const safeParseDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return null;
        try {
            // Split YYYY-MM-DD to avoid timezone shifts
            const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const [y, m, d] = datePart.split('-').map(Number);
            if (!y || !m || !d) return parseISO(dateStr); // Fallback to parseISO if format is weird
            return new Date(y, m - 1, d);
        } catch (e) {
            return parseISO(dateStr);
        }
    };

    const fetchCalendarData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            let workspaceId = localStorage.getItem('selectedWorkspaceId');

            if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
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

            // Connect to WebSocket room
            socketService.connect(finalWorkspaceId);

            // Fetch tasks and milestones
            const [tasksRes, milestonesRes] = await Promise.all([
                fetch(`http://localhost:4000/tasks/search?workspaceId=${finalWorkspaceId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:4000/milestones?workspaceId=${finalWorkspaceId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (tasksRes.ok) {
                const data = await tasksRes.json();
                setTasks(data.tasks || []);
            }
            if (milestonesRes.ok) {
                const data = await milestonesRes.json();
                setMilestones(data.milestones || []);
            }
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
            showToast('error', 'Error', 'Failed to load calendar data');
        } finally {
            setLoading(false);
        }
    }, [router, showToast]);

    useEffect(() => {
        fetchCalendarData();

        // Socket listener for real-time updates
        socketService.on('task-updated', () => {
            fetchCalendarData();
        });

        return () => {
            socketService.off('task-updated');
        };
    }, [fetchCalendarData]);

    const [showMilestones, setShowMilestones] = useState(true);
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

    const projects = useMemo(() => {
        const uniqueProjects = new Set<string>();
        const projectList: { id: string, name: string, color?: string }[] = [];
        tasks.forEach(task => {
            if (!uniqueProjects.has(task.project.id)) {
                uniqueProjects.add(task.project.id);
                projectList.push(task.project);
            }
        });
        return projectList;
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        const today = startOfDay(new Date());
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus.length === 0 || filterStatus.includes(task.status);
            const matchesProject = selectedProjectIds.length === 0 || selectedProjectIds.includes(task.projectId);

            let matchesOverdue = true;
            if (overdueOnly && task.dueDate) {
                const dueDate = safeParseDate(task.dueDate);
                matchesOverdue = dueDate ? dueDate < today && task.status !== 'DONE' : false;
            }

            return (task.dueDate || task.startDate) && matchesSearch && matchesStatus && matchesProject && matchesOverdue;
        });
    }, [tasks, searchQuery, filterStatus, selectedProjectIds, overdueOnly]);

    const filteredMilestones = useMemo(() => {
        if (!showMilestones) return [];
        return milestones.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProject = selectedProjectIds.length === 0 || selectedProjectIds.includes(m.projectId);
            return matchesSearch && matchesProject;
        });
    }, [milestones, showMilestones, searchQuery, selectedProjectIds]);

    const next = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const today = () => setCurrentDate(new Date());

    const renderHeader = () => {
        return (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <CalendarIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Calendar</h1>
                    </div>
                    <p className="text-text-secondary text-sm font-medium opacity-80">Personal and project-aware scheduler</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex items-center bg-surface/40 border border-border p-1 rounded-xl shadow-sm">
                        {[
                            { id: 'day', label: 'Day', icon: Monitor },
                            { id: 'week', label: 'Week', icon: CalendarRange },
                            { id: 'month', label: 'Month', icon: CalendarDays }
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id as CalendarView)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-text-secondary hover:bg-surface-secondary'
                                    }`}
                            >
                                <v.icon size={14} />
                                {v.label}
                            </button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2 bg-surface/40 border border-border p-1 rounded-xl shadow-sm">
                        <button onClick={prev} className="p-2 hover:bg-surface-secondary rounded-lg text-text-secondary transition-all">
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={today}
                            className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-text-primary hover:bg-surface-secondary rounded-lg transition-all"
                        >
                            Today
                        </button>
                        <button onClick={next} className="p-2 hover:bg-surface-secondary rounded-lg text-text-secondary transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="text-sm font-black text-text-primary min-w-[150px] text-center uppercase tracking-[0.2em] bg-primary/5 py-2 px-6 rounded-2xl border border-primary/10 shadow-inner">
                        {view === 'day' ? format(currentDate, 'MMMM d, yyyy') : format(currentDate, 'MMMM yyyy')}
                    </div>

                    {/* Quick Filters */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2.5 rounded-xl border transition-all ${showFilters
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-surface/40 border-border text-text-secondary hover:bg-surface-secondary'
                                }`}
                        >
                            <Filter size={20} />
                        </button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute top-full right-0 mt-4 w-[600px] max-w-[calc(100vw-2rem)] bg-surface border border-border p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] backdrop-blur-xl"
                                >
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-wrap items-start gap-8">
                                            {/* Search */}
                                            <div className="flex-1 min-w-[200px]">
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3 block">Search Context</span>
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder="Tasks or milestones..."
                                                        className="w-full bg-background border border-border rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3 block">Quick Status</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {['TODO', 'IN_PROGRESS', 'DONE'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus.includes(s)
                                                                ? 'bg-primary text-white border-primary shadow-md'
                                                                : 'bg-background hover:bg-surface-secondary text-text-secondary border-border'
                                                                }`}
                                                        >
                                                            {s.replace('_', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-start gap-8">
                                            {/* Projects */}
                                            <div className="flex-1">
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3 block">Projects</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {projects.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => setSelectedProjectIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 ${selectedProjectIds.includes(p.id)
                                                                ? 'bg-surface text-text-primary border-primary shadow-md ring-1 ring-primary'
                                                                : 'bg-background text-text-secondary border-border hover:bg-surface-secondary'
                                                                }`}
                                                        >
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#4F46E5' }} />
                                                            {p.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Focus Toggles */}
                                            <div>
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3 block">Focus</span>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setShowMilestones(!showMilestones)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${showMilestones ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-background border-border text-text-secondary'
                                                            }`}
                                                    >
                                                        <Trophy size={14} /> Milestones
                                                    </button>
                                                    <button
                                                        onClick={() => setOverdueOnly(!overdueOnly)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${overdueOnly ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 'bg-background border-border text-text-secondary'
                                                            }`}
                                                    >
                                                        <Clock size={14} /> Overdue
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-border flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <button className="text-[10px] font-black text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors">Workspace Views</button>
                                            </div>
                                            <button
                                                onClick={() => { setSearchQuery(''); setFilterStatus([]); setSelectedProjectIds([]); setOverdueOnly(false); setShowMilestones(true); }}
                                                className="px-4 py-2 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    };

    const handleTaskDrop = async (taskId: string, newDate: Date) => {
        try {
            const token = localStorage.getItem('token');
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            // Optimistic update
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, dueDate: newDate.toISOString() } : t
            ));

            const res = await fetch(`http://localhost:4000/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ dueDate: newDate.toISOString() })
            });

            if (!res.ok) {
                fetchCalendarData(); // Revert
                showToast('error', 'Update Failed', 'Could not update task date');
            } else {
                showToast('success', 'Task Rescheduled', `Task "${task.title}" moved to ${format(newDate, 'MMM d')}`);
            }
        } catch (error) {
            console.error('Task drop error:', error);
            fetchCalendarData();
        }
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="grid grid-cols-7 mb-2">
                    {days.map((day, i) => (
                        <div key={i} className="text-center py-2">
                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{day}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 border-t border-l border-border rounded-2xl overflow-hidden shadow-2xl bg-surface/5">
                    {calendarDays.map((day, i) => {
                        const dayTasks = filteredTasks.filter(task => {
                            const start = task.startDate ? safeParseDate(task.startDate) : (task.dueDate ? safeParseDate(task.dueDate) : null);
                            const end = task.dueDate ? safeParseDate(task.dueDate) : (task.startDate ? safeParseDate(task.startDate) : null);
                            if (!start || !end) return false;
                            return isWithinInterval(day, { start: startOfDay(start), end: endOfDay(end) });
                        });
                        const dayMilestones = filteredMilestones.filter(m => {
                            const mDate = safeParseDate(m.dueDate);
                            return mDate ? isSameDay(mDate, day) : false;
                        });

                        return (
                            <div
                                key={day.getTime()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const taskId = e.dataTransfer.getData('taskId');
                                    handleTaskDrop(taskId, day);
                                }}
                                className={`min-h-[120px] border-r border-b border-border p-2 transition-all flex flex-col gap-1 ${!isSameMonth(day, monthStart) ? 'bg-surface-secondary/20 opacity-30 grayscale pointer-events-none' : 'bg-surface/10'
                                    } ${isToday(day) ? 'bg-primary/5 ring-1 ring-primary/20 ring-inset' : ''} hover:bg-primary/5 group`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[11px] font-black transition-all ${isToday(day) ? 'text-primary' : 'text-text-secondary/60 group-hover:text-text-primary'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="flex gap-1">
                                        {dayMilestones.map(m => (
                                            <Trophy key={m.id} size={10} className="text-amber-500 animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
                                    {dayTasks.map(task => (
                                        <button
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('taskId', task.id);
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                            className={`text-[9px] font-bold p-1.5 rounded-lg truncate text-left transition-all border border-transparent flex items-center gap-1.5 active:scale-95 cursor-grab active:cursor-grabbing ${task.status === 'DONE'
                                                ? 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/10'
                                                : 'bg-primary/10 text-primary border-primary/20 hover:border-primary/40'
                                                }`}
                                        >
                                            <div
                                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: task.project.color || '#4F46E5' }}
                                            />
                                            {task.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };


    const renderWeekView = () => {
        const start = startOfWeek(currentDate);
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-500">
                <div className="grid grid-cols-[80px_1fr] flex-1 overflow-auto custom-scrollbar border border-border rounded-3xl bg-surface/5 shadow-2xl">
                    {/* Header Spacer */}
                    <div className="border-r border-b border-border bg-surface-secondary/40 sticky top-0 z-10" />
                    <div className="grid grid-cols-7 border-b border-border bg-surface-secondary/40 sticky top-0 z-10 backdrop-blur-md">
                        {weekDays.map((day, i) => (
                            <div key={i} className={`text-center py-4 border-r border-border last:border-0 ${isToday(day) ? 'bg-primary/5' : ''}`}>
                                <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{format(day, 'EEE')}</div>
                                <div className={`text-lg font-black ${isToday(day) ? 'text-primary' : 'text-text-primary'}`}>{format(day, 'd')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Time Rows */}
                    {hours.map(hour => (
                        <Fragment key={hour}>
                            <div className="text-[10px] font-black text-text-secondary/50 text-right pr-4 py-8 border-r border-b border-border uppercase tracking-tighter">
                                {format(setHours(new Date(), hour), 'h aa')}
                            </div>
                            <div className="grid grid-cols-7 border-b border-border">
                                {weekDays.map((day, i) => {
                                    const projectsInHour = filteredTasks.filter(task => {
                                        const start = task.startDate ? safeParseDate(task.startDate) : (task.dueDate ? safeParseDate(task.dueDate) : null);
                                        const end = task.dueDate ? safeParseDate(task.dueDate) : (task.startDate ? safeParseDate(task.startDate) : null);
                                        if (!start || !end) return false;

                                        // If it spans multiple days, show only on end date for week view time slot or start date? 
                                        // Usually tasks with range are "all day". For simplicity, show if it starts or ends or is within.
                                        // For time-specific, we check hours only if it's the same day.
                                        if (isSameDay(end, day)) {
                                            return end.getHours() === hour;
                                        }
                                        return false;
                                    });

                                    return (
                                        <div
                                            key={i}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const taskId = e.dataTransfer.getData('taskId');
                                                const dropDate = setHours(startOfDay(day), hour);
                                                handleTaskDrop(taskId, dropDate);
                                            }}
                                            className={`border-r border-border last:border-0 p-1 min-h-[80px] hover:bg-primary/[0.02] transition-colors relative ${isToday(day) ? 'bg-primary/[0.01]' : ''}`}
                                        >
                                            {projectsInHour.map(task => (
                                                <button
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('taskId', task.id);
                                                    }}
                                                    onClick={() => setSelectedTask(task)}
                                                    className="w-full mb-1 text-[9px] font-black p-2 rounded-xl bg-surface border border-border text-text-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex flex-col gap-1 border-l-4 cursor-grab active:cursor-grabbing"
                                                    style={{ borderLeftColor: task.project.color }}
                                                >
                                                    <span className="opacity-50 text-[8px] uppercase">{task.project.name}</span>
                                                    <span className="truncate">{task.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </Fragment>
                    ))}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const dayTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            const dDate = safeParseDate(task.dueDate);
            return dDate ? isSameDay(dDate, currentDate) : false;
        });

        return (
            <div className="flex flex-col h-full max-w-4xl mx-auto animate-in zoom-in duration-500">
                <div className="grid grid-cols-[100px_1fr] flex-1 overflow-auto custom-scrollbar border border-border rounded-3xl bg-surface/5 shadow-2xl">
                    <div className="border-r border-b border-border bg-surface-secondary/40 sticky top-0 z-10" />
                    <div className="py-6 px-8 border-b border-border bg-surface-secondary/40 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-1">{format(currentDate, 'EEEE')}</div>
                            <div className="text-2xl font-black text-text-primary">{format(currentDate, 'MMMM d, yyyy')}</div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black text-primary">{dayTasks.length} Tasks Scheduled</span>
                        </div>
                    </div>

                    {hours.map(hour => {
                        const projectsInHour = dayTasks.filter(task => {
                            const date = task.dueDate ? safeParseDate(task.dueDate) : (task.startDate ? safeParseDate(task.startDate) : null);
                            return date && date.getHours() === hour;
                        });

                        return (
                            <Fragment key={hour}>
                                <div className="text-[10px] font-black text-text-secondary/50 text-right pr-6 py-12 border-r border-b border-border uppercase tracking-widest bg-surface/20">
                                    {format(setHours(new Date(), hour), 'h:mm aa')}
                                </div>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const taskId = e.dataTransfer.getData('taskId');
                                        const dropDate = setHours(startOfDay(currentDate), hour);
                                        handleTaskDrop(taskId, dropDate);
                                    }}
                                    className="border-b border-border p-4 min-h-[120px] hover:bg-primary/[0.02] transition-colors flex flex-col gap-2"
                                >
                                    {projectsInHour.map(task => (
                                        <button
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('taskId', task.id);
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                            className="group w-full max-w-2xl p-4 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-start gap-4 border-l-8 cursor-grab active:cursor-grabbing"
                                            style={{ borderLeftColor: task.project.color }}
                                        >
                                            <div className={`p-3 rounded-2xl ${task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                                {task.status === 'DONE' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">{task.project.name}</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${task.priority === 'URGENT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                                        task.priority === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                                            'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">{task.title}</h3>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col h-screen overflow-hidden">
                {renderHeader()}


                <div className="flex-1 min-h-0 relative">
                    {loading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-3xl">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Syncing work context...</div>
                            </div>
                        </div>
                    )}

                    <div className="h-full pb-4">
                        {view === 'month' && renderMonthView()}
                        {view === 'week' && renderWeekView()}
                        {view === 'day' && renderDayView()}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailPanel
                        task={selectedTask}
                        project={null}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => fetchCalendarData()}
                    />
                )}
            </AnimatePresence>

            {/* Empty State Overlay if no tasks */}
            {!loading && filteredTasks.length === 0 && (
                <div className="fixed inset-x-0 bottom-20 pointer-events-none flex justify-center">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-surface/80 backdrop-blur-xl border border-border px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-text-primary">No work matches your radar</div>
                            <div className="text-[10px] text-text-secondary uppercase tracking-widest font-black opacity-60">Adjust filters or view tasks</div>
                        </div>
                        <button
                            className="px-6 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all pointer-events-auto"
                            onClick={() => router.push('/dashboard/tasks')}
                        >
                            View All Tasks
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
}

