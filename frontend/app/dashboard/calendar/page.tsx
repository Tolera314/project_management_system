'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Plus, Clock, MoreHorizontal, CheckCircle2, Circle
} from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth,
    endOfMonth, startOfWeek, endOfWeek, isSameMonth,
    isSameDay, addDays, eachDayOfInterval, isToday
} from 'date-fns';
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
}

export default function CalendarPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchTasks();
    }, [currentMonth]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const workspaceId = localStorage.getItem('selectedWorkspaceId');

            if (!token) {
                router.push('/login');
                return;
            }

            // Fetch tasks for the whole workspace
            const response = await fetch(`http://localhost:4000/tasks/search?workspaceId=${workspaceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            showToast('error', 'Error', 'Failed to load calendar tasks');
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">Calendar</h1>
                    <p className="text-text-secondary text-sm">Track your deadlines and schedule</p>
                </div>
                <div className="flex items-center gap-4 bg-surface/40 border border-border rounded-xl p-1">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-surface-secondary rounded-lg text-text-secondary hover:text-primary transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-text-primary min-w-[140px] text-center uppercase tracking-widest">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-surface-secondary rounded-lg text-text-secondary hover:text-primary transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map((day, i) => (
                    <div key={i} className="text-center">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{day}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        const rows: React.ReactNode[] = [];
        let dayCells: React.ReactNode[] = [];

        calendarDays.forEach((day, i) => {
            const dayTasks = tasks.filter(task => {
                if (!task.dueDate) return false;
                return isSameDay(new Date(task.dueDate), day);
            });

            dayCells.push(
                <div
                    key={day.toString()}
                    className={`min-h-[120px] md:min-h-[150px] border border-border p-2 transition-all flex flex-col gap-1 \${
                        !isSameMonth(day, monthStart) ? 'bg-surface-secondary/30 opacity-40 pointer-events-none' : 'bg-surface/20'
                    } \${isToday(day) ? 'ring-1 ring-primary/50' : ''}`}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold \${isToday(day) ? 'text-primary bg-primary/10 w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-500'}`}>
                            {format(day, 'd')}
                        </span>
                        {dayTasks.length > 3 && (
                            <span className="text-[10px] text-slate-500">+{dayTasks.length - 3}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                        {dayTasks.slice(0, 3).map(task => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`text-[10px] font-medium p-1.5 rounded-md truncate text-left transition-all border border-transparent \${
                                    task.status === 'DONE' 
                                        ? 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20' 
                                        : 'bg-primary/10 text-primary border-primary/20 hover:border-primary/50 active:scale-95'
                                }`}
                            >
                                {task.title}
                            </button>
                        ))}
                    </div>
                </div>
            );

            if ((i + 1) % 7 === 0) {
                rows.push(
                    <div key={`row-\${day.toString()}`} className="grid grid-cols-7">
                        {dayCells}
                    </div>
                );
                dayCells = [];
            }
        });

        return <div className="border border-border rounded-2xl overflow-hidden shadow-xl bg-surface/5">{rows}</div>;
    };

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col h-full">
                {renderHeader()}
                <div className="flex-1 bg-surface/10 border border-border rounded-3xl p-4 md:p-8 overflow-auto custom-scrollbar shadow-inner">
                    {renderDays()}
                    {loading ? (
                        <div className="h-full flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        renderCells()
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailPanel
                        task={selectedTask}
                        project={null}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => fetchTasks()}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
