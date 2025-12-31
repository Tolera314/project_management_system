'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    addDays,
    addWeeks,
    differenceInDays,
    startOfWeek,
    endOfWeek,
    format,
    isSameDay,
    parseISO,
    isValid,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    eachWeekOfInterval
} from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Diamond, User as UserIcon } from 'lucide-react';

interface TimelineViewProps {
    tasks: any[];
    milestones?: any[];
    projectId: string;
    onTaskClick: (task: any) => void;
    onRefresh: () => void;
}

const DAY_WIDTH = 50; // Pixels per day
const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 40;
const SIDEBAR_WIDTH = 300;

export default function TimelineView({ tasks, milestones, projectId, onTaskClick, onRefresh }: TimelineViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState<'week' | 'month'>('week'); // todo: implement zoom

    // Flatten tasks to include subtasks
    const allTasks = useMemo(() => {
        const flat: any[] = [];
        const recurse = (items: any[]) => {
            items.forEach(item => {
                flat.push(item);
                if (item.children && item.children.length > 0) {
                    recurse(item.children); // Add subtasks
                }
            });
        };
        recurse(tasks);
        return flat;
    }, [tasks]);

    // Calculate global date range
    const { startDate, endDate, totalDays } = useMemo(() => {
        let start = new Date();
        let end = addDays(start, 30); // Default 30 days view

        const taskDates = allTasks
            .flatMap(t => [t.startDate, t.dueDate])
            .filter(d => d)
            .map(d => new Date(d));

        const milestoneDates = (milestones || [])
            .map(m => m.dueDate)
            .filter(d => d)
            .map(d => new Date(d));

        const allDates = [...taskDates, ...milestoneDates];

        if (allDates.length > 0) {
            start = new Date(Math.min(...allDates.map(d => d.getTime())));
            end = new Date(Math.max(...allDates.map(d => d.getTime())));

            // Add padding
            start = addDays(start, -7);
            end = addDays(end, 14);
        }

        // Align to start of week
        start = startOfWeek(start, { weekStartsOn: 1 });
        end = endOfWeek(end, { weekStartsOn: 1 });

        return {
            startDate: start,
            endDate: end,
            totalDays: differenceInDays(end, start) + 1
        };
    }, [allTasks, milestones]);

    // Generate grid columns
    const gridDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const gridWeeks = useMemo(() => {
        return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    }, [startDate, endDate]);

    // Sort tasks and milestones for display
    const sortedItems = useMemo(() => {
        // Combine tasks and milestones? 
        // Typically timeline has separate sections or mixed. 
        // Let's mix them but sort by start date/due date.

        const items = [
            ...allTasks.map(t => ({ ...t, type: 'TASK' })),
            ...(milestones || []).map(m => ({ ...m, type: 'MILESTONE', startDate: m.dueDate, title: m.name }))
        ];

        return items.sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : (a.dueDate ? new Date(a.dueDate).getTime() : 0);
            const dateB = b.startDate ? new Date(b.startDate).getTime() : (b.dueDate ? new Date(b.dueDate).getTime() : 0);
            return dateA - dateB;
        });
    }, [allTasks, milestones]);

    // Helper to get position
    const getXPosition = (date: string | Date | null) => {
        if (!date) return 0;
        const d = new Date(date);
        const days = differenceInDays(d, startDate);
        return days * DAY_WIDTH;
    };

    const getWidth = (start: string | null, end: string | null) => {
        if (!start || !end) return DAY_WIDTH; // Default width
        const s = new Date(start);
        const e = new Date(end);
        const days = differenceInDays(e, s) + 1; // Inclusive
        return Math.max(days * DAY_WIDTH, DAY_WIDTH);
    };

    // Dependencies Lines
    const dependencyLines = useMemo(() => {
        const lines: React.ReactNode[] = [];
        // Only map tasks for dependencies
        const taskItems = sortedItems.filter(i => i.type === 'TASK');

        taskItems.forEach((task, index) => {
            if (task.dependencies) {
                task.dependencies.forEach((dep: any) => {
                    const sourceTask = taskItems.find(t => t.id === dep.sourceId);
                    if (sourceTask && sourceTask.dueDate && task.startDate) {
                        // Find actual UI index in the sorted list (could cover milestones)
                        const sourceIndex = sortedItems.indexOf(sourceTask);
                        const targetIndex = sortedItems.indexOf(task);

                        const startX = getXPosition(sourceTask.dueDate) + DAY_WIDTH; // End of source
                        const startY = sourceIndex * ROW_HEIGHT + (ROW_HEIGHT / 2);

                        const endX = getXPosition(task.startDate); // Start of target
                        const endY = targetIndex * ROW_HEIGHT + (ROW_HEIGHT / 2);

                        // Simple SVG path
                        const path = `M ${startX} ${startY} C ${startX + 20} ${startY}, ${endX - 20} ${endY}, ${endX} ${endY}`;

                        lines.push(
                            <path
                                key={`${dep.sourceId}-${task.id}`}
                                d={path}
                                fill="none"
                                stroke="#64748B"
                                strokeWidth="1.5"
                                markerEnd="url(#arrowhead)"
                                className="opacity-50 hover:opacity-100 hover:stroke-primary transition-all"
                            />
                        );
                    }
                });
            }
        });
        return lines;
    }, [sortedItems, startDate]);

    return (
        <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden rounded-xl border border-white/5">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-surface-lighter/50">
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">
                        This Week
                    </button>
                    <div className="text-sm text-text-secondary">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Zoom controls placeholder */}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (Task Names) */}
                <div className="w-[300px] flex-shrink-0 border-r border-white/5 bg-surface-lighter/20 flex flex-col overflow-hidden z-10 shadow-xl">
                    <div className="h-[60px] border-b border-white/5 flex items-center px-4 font-bold text-xs text-text-secondary uppercase tracking-wider bg-[#0A0A0A]">
                        Task
                    </div>
                    <div className="flex-1 overflow-y-hidden"> {/* Scroll synced via JS later or fixed layout */}
                        {sortedItems.map((item) => (
                            <div
                                key={item.id}
                                className="h-[40px] flex items-center px-4 border-b border-white/5 hover:bg-white/5 cursor-pointer text-sm text-white truncate group"
                                onClick={() => item.type === 'TASK' ? onTaskClick(item) : null}
                            >
                                {item.type === 'MILESTONE' ? (
                                    <Diamond size={14} className="text-amber-500 mr-2 fill-amber-500/20" />
                                ) : (
                                    <>
                                        {/* Indent if subtask */}
                                        {item.parentId && <div className="w-4" />}
                                        <span className={`w-2 h-2 rounded-full mr-2 ${item.status === 'DONE' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    </>
                                )}
                                <span className={item.parentId ? 'text-text-secondary text-xs' : ''}>{item.title || item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 overflow-auto relative custom-scrollbar" ref={containerRef}>
                    <div style={{ width: totalDays * DAY_WIDTH, minHeight: '100%' }} className="relative">

                        {/* Header: Months & Days */}
                        <div className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-white/5">
                            <div className="flex h-[30px] border-b border-white/5">
                                {gridWeeks.map((week, i) => (
                                    <div
                                        key={i}
                                        className="border-r border-white/5 px-2 text-[10px] font-bold text-text-secondary flex items-center uppercase tracking-wider"
                                        style={{ width: 7 * DAY_WIDTH }}
                                    >
                                        {format(week, 'MMM d')}
                                    </div>
                                ))}
                            </div>
                            <div className="flex h-[30px]">
                                {gridDays.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`flex-shrink-0 border-r border-white/5 flex items-center justify-center text-[10px] text-text-secondary ${isSameDay(day, new Date()) ? 'bg-blue-500/10 text-blue-500 font-bold' : ''}`}
                                        style={{ width: DAY_WIDTH }}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 top-[60px] pointer-events-none">
                            {gridDays.map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 border-r border-white/[0.03]"
                                    style={{ left: (i + 1) * DAY_WIDTH }}
                                />
                            ))}
                            {/* Today Marker */}
                            {differenceInDays(new Date(), startDate) >= 0 && (
                                <div
                                    className="absolute top-0 bottom-0 border-r border-blue-500 z-20"
                                    style={{ left: differenceInDays(new Date(), startDate) * DAY_WIDTH + (DAY_WIDTH / 2) }}
                                >
                                    <div className="absolute -top-1 -ml-1 w-2 h-2 bg-blue-500 rounded-full" />
                                </div>
                            )}
                        </div>

                        {/* Dependency Lines (SVG Layer) */}
                        <svg className="absolute top-[60px] left-0 w-full h-full pointer-events-none z-0">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
                                </marker>
                            </defs>
                            {dependencyLines}
                        </svg>

                        {/* Task Bars & Milestones */}
                        <div className="pt-[60px]"> {/* Offset for header */}
                            {sortedItems.map((item) => {
                                const left = getXPosition(item.startDate || item.dueDate || new Date()); // Fallback
                                const width = item.type === 'TASK' ? getWidth(item.startDate, item.dueDate) : 20; // Fixed width for milestones

                                return (
                                    <div
                                        key={item.id}
                                        className="h-[40px] relative border-b border-white/5 hover:bg-white/[0.02] flex items-center"
                                    >
                                        {item.type === 'MILESTONE' ? (
                                            <div
                                                className="absolute w-5 h-5 bg-amber-500 transform rotate-45 border-2 border-[#0A0A0A] shadow-md z-10 hover:scale-110 transition-transform cursor-pointer"
                                                style={{ left: left - 10 }} // Center on date line
                                                title={`Milestone: ${item.name}`}
                                            />
                                        ) : (
                                            item.startDate && item.dueDate ? (
                                                <motion.div
                                                    className={`absolute top-2 bottom-2 rounded-md flex items-center px-2 text-[10px] font-bold text-white shadow-sm cursor-pointer hover:brightness-110 overflow-hidden whitespace-nowrap ${item.status === 'DONE' ? 'bg-emerald-500/50 border border-emerald-500/50' : 'bg-primary border border-primary/50'
                                                        }`}
                                                    style={{ left, width }}
                                                    onClick={() => onTaskClick(item)}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                >
                                                    {item.title}
                                                </motion.div>
                                            ) : (
                                                <div
                                                    className="absolute top-1/2 left-4 w-2 h-2 bg-slate-500 rounded-full transform -translate-y-1/2"
                                                    title="No dates set"
                                                />
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
