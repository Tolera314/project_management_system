'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Calendar,
    Target,
    ArrowUpRight,
    Users,
    Clock,
    Plus,
    MoreHorizontal,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import CreateMilestoneModal from './CreateMilestoneModal';

interface MilestoneDashboardProps {
    projectId: string;
    onRefresh: () => void;
    projectTasks: any[];
    onMilestoneClick: (milestone: any) => void;
}

export default function MilestoneDashboard({ projectId, onRefresh, projectTasks, onMilestoneClick }: MilestoneDashboardProps) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchMilestones();
    }, [projectId]);

    const fetchMilestones = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/milestones?projectId=${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.milestones) setMilestones(data.milestones);
        } catch (error) {
            console.error('Fetch milestones error:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
    const projectProgress = milestones.length > 0
        ? Math.round((completedMilestones / milestones.length) * 100)
        : 0;

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-32 bg-white/5 rounded-3xl" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Project Milestones Overall Progress */}
            <div className="relative p-8 bg-surface/30 border border-white/5 rounded-3xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Target size={120} />
                </div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="text-primary" size={24} />
                            <h2 className="text-xl font-bold text-text-secondary">Project Milestones</h2>
                        </div>
                        <p className="text-text-secondary text-sm mb-6">
                            {completedMilestones} of {milestones.length} structural milestones completed
                        </p>

                        <div className="flex items-center gap-12">
                            <div>
                                <div className="text-3xl font-black text-text-secondary mb-1">{projectProgress}%</div>
                                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest text-primary">Overall Delivery</div>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10" />
                            <div>
                                <div className="text-3xl font-black text-rose-500 mb-1">
                                    {milestones.filter(m => m.status === 'OVERDUE').length}
                                </div>
                                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Overdue</div>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-1/3 flex flex-col gap-4">
                        <div className="flex justify-between text-xs font-bold text-text-secondary uppercase tracking-tighter">
                            <span>Completion Rate</span>
                            <span>{projectProgress}%</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${projectProgress}%` }}
                                className="h-full bg-primary shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 mt-2 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Plus size={18} />
                            New Milestone
                        </button>
                    </div>
                </div>
            </div>

            {/* Milestones List */}
            {milestones.length === 0 ? (
                <div className="py-20 text-center bg-surface/20 border border-dashed border-white/10 rounded-3xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Target className="text-text-secondary" />
                    </div>
                    <h3 className="text-lg font-bold text-text-secondary mb-2">No Milestones Yet</h3>
                    <p className="text-text-secondary max-w-sm mx-auto mb-8">
                        Milestones help you track major project checkpoints and delivery targets.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl border border-white/10 hover:bg-primary/80 transition-all"
                    >
                        Create your first milestone
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-6 py-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        <div className="flex items-center gap-12">
                            <span className="w-64">Milestone</span>
                            <span className="w-32">Due Date</span>
                            <span className="w-32">Status</span>
                        </div>
                        <div className="flex items-center gap-12 pr-12">
                            <span className="w-40 text-center">Progress</span>
                            <span className="w-24">Tasks</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {milestones.map((m, i) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => onMilestoneClick(m)}
                                className="flex items-center justify-between p-6 bg-surface/30 border border-white/5 rounded-2xl hover:bg-surface/50 hover:border-white/10 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-12">
                                    <div className="flex items-center gap-4 w-64">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getStatusStyles(m.status)}`}>
                                            <Target size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{m.name}</div>
                                            <div className="text-[10px] text-text-secondary line-clamp-1">{m.description || 'No description'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary w-32">
                                        <Calendar size={14} />
                                        {new Date(m.dueDate).toLocaleDateString()}
                                    </div>

                                    <div className="w-32">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(m.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {m.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="w-40 space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase">
                                            <span>{m.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${m.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                    m.status === 'OVERDUE' ? 'bg-rose-500' :
                                                        m.status === 'AT_RISK' ? 'bg-amber-500' : 'bg-primary'
                                                    }`}
                                                style={{ width: `${m.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs font-bold text-text-secondary w-24">
                                        <CheckCircle2 size={14} />
                                        {m.completedTaskCount}/{m.taskCount}
                                    </div>

                                    <div className="flex items-center gap-2 pr-2">
                                        <button className="p-2 hover:bg-white/5 rounded-lg text-text-secondary opacity-0 group-hover:opacity-100 transition-all">
                                            <MoreHorizontal size={18} />
                                        </button>
                                        <div className="text-text-secondary group-hover:text-primary transition-colors">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <CreateMilestoneModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectId}
                onSuccess={() => {
                    fetchMilestones();
                    onRefresh();
                }}
                projectTasks={projectTasks}
            />
        </div>
    );
}
