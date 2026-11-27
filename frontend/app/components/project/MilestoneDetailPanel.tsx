'use client';

import { motion } from 'framer-motion';
import {
    X,
    Target,
    Calendar,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MoreHorizontal,
    AlignLeft,
    Users,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';

interface MilestoneDetailPanelProps {
    milestone: any;
    onClose: () => void;
    onRefresh: () => void;
}

export default function MilestoneDetailPanel({ milestone, onClose, onRefresh }: MilestoneDetailPanelProps) {
    if (!milestone) return null;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'AT_RISK':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'OVERDUE':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default:
                return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-white/10 z-[60] shadow-2xl flex flex-col"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getStatusStyles(milestone.status)} shadow-lg shadow-black/20`}>
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white leading-none">{milestone.name}</h2>
                            <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(milestone.status)}`}>
                                {milestone.status.replace('_', ' ')}
                            </div>
                        </div>
                        <div className="text-xs text-text-secondary mt-1 flex items-center gap-2">
                            <Calendar size={12} />
                            Due {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-8 space-y-10">
                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-primary" /> Delivery Progress
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-white">{milestone.progress}%</span>
                            <span className="text-xs text-text-secondary mb-1">completed</span>
                        </div>
                        <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${milestone.progress}%` }}
                                className={`h-full ${milestone.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary'}`}
                            />
                        </div>
                    </div>
                    <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock size={12} className="text-amber-500" /> Time Remaining
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-white">
                                {Math.max(0, Math.ceil((new Date(milestone.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))}
                            </span>
                            <span className="text-xs text-text-secondary mb-1">days left</span>
                        </div>
                        <p className="mt-4 text-[10px] text-text-secondary italic">Derived from target date</p>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                    <div className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                        <AlignLeft size={14} /> Description
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5 italic">
                        {milestone.description || "No description provided for this milestone."}
                    </p>
                </div>

                {/* Linked Tasks */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={14} /> Linked Tasks ({milestone.tasks?.length || 0})
                        </div>
                        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                            + Edit Links
                        </button>
                    </div>

                    <div className="space-y-2">
                        {milestone.tasks?.map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : 'bg-primary'}`} />
                                    <span className={`text-sm tracking-tight truncate ${task.status === 'DONE' ? 'text-text-secondary' : 'text-white font-medium'}`}>
                                        {task.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] font-bold text-text-secondary uppercase px-2 py-0.5 rounded bg-white/5">
                                        {task.status}
                                    </div>
                                    <ArrowUpRight size={14} className="text-text-secondary group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        ))}
                        {(!milestone.tasks || milestone.tasks.length === 0) && (
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                <AlertTriangle size={24} className="text-text-secondary mb-3 opacity-30" />
                                <p className="text-xs text-text-secondary">No tasks linked to this milestone yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Meta Info */}
                <div className="pt-6 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Users size={12} /> Created By
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {milestone.createdBy?.firstName?.[0] || 'U'}
                                </div>
                                <span className="text-xs text-text-primary">
                                    {milestone.createdBy?.firstName} {milestone.createdBy?.lastName}
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock size={12} /> Last Updated
                            </div>
                            <span className="text-xs text-text-primary">
                                {new Date(milestone.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/5 bg-surface/50">
                <button className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    Mark as Completed
                </button>
            </div>
        </motion.div>
    );
}
