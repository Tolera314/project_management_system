import { useState } from 'react';

import {
    Plus,
    LayoutGrid,
    ListFilter,
    Search,
    Share2,
    MoreHorizontal,
    ChevronRight,
    Filter,
    ArrowUpDown,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProjectHeaderProps {
    project: any;
    activeView: string;
    onViewChange: (view: string) => void;
}

export default function ProjectHeader({ project, activeView, onViewChange }: ProjectHeaderProps) {
    const views = [
        { id: 'list', label: 'List', icon: LayoutGrid },
        { id: 'board', label: 'Board', icon: LayoutGrid },
        { id: 'milestones', label: 'Milestones', icon: CheckCircle2 },
        { id: 'timeline', label: 'Timeline', icon: LayoutGrid },
    ];


    return (
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
            <div className="flex flex-col gap-4">
                {/* Top Row: Breadcrumbs and Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            <Link href="/dashboard" className="hover:text-white transition-colors">Workspace</Link>
                            <ChevronRight size={12} />
                            <span className="text-text-primary">Projects</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 mr-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-surface-lighter flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-white/5">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                            <button className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center text-text-secondary hover:text-primary transition-all">
                                <Plus size={14} />
                            </button>
                        </div>

                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-secondary hover:text-white">
                            <Share2 size={18} />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-secondary hover:text-white">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Project Title and Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                            style={{
                                backgroundColor: `${project.color || '#4F46E5'}15`,
                                border: `1px solid ${project.color || '#4F46E5'}40`
                            }}
                        >
                            <div
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: project.color || '#4F46E5' }}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-white tracking-tight">{project.name}</h1>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    On Track
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
                        <div className="flex items-center p-1 bg-surface-lighter/50 rounded-lg border border-white/5">
                            {views.map((view) => (
                                <button
                                    key={view.id}
                                    onClick={() => onViewChange(view.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeView === view.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-text-secondary hover:text-white'
                                        }`}
                                >
                                    <view.icon size={14} />
                                    {view.label}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-[1px] bg-white/10 mx-1" />

                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-secondary hover:text-white flex items-center gap-2 text-xs font-medium">
                                <Filter size={16} />
                                Filter
                            </button>
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-secondary hover:text-white flex items-center gap-2 text-xs font-medium">
                                <ArrowUpDown size={16} />
                                Sort
                            </button>
                        </div>

                        <button className="flex items-center gap-2 pl-4 pr-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/25 active:scale-95 ml-2">
                            <Plus size={18} />
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

