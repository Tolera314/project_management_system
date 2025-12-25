'use client';

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    TrendingUp,
    Users
} from 'lucide-react';

interface ProjectOverviewStripProps {
    project: any;
}

export default function ProjectOverviewStrip({ project }: ProjectOverviewStripProps) {
    const stats = [
        {
            label: 'Progress',
            value: '68%',
            subtext: 'Overall completion',
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            label: 'Open Tasks',
            value: project._count?.tasks || 0,
            subtext: 'Needs attention',
            icon: Circle,
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            label: 'Overdue',
            value: '3',
            subtext: 'High priority',
            icon: AlertCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        },
        {
            label: 'Members',
            value: project.members?.length || 1,
            subtext: 'Active contributors',
            icon: Users,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            label: 'Velocity',
            value: '+12%',
            subtext: 'VS last week',
            icon: TrendingUp,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="p-4 bg-surface/30 border border-white/5 rounded-2xl hover:bg-surface/50 transition-all group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{stat.value}</span>
                        <span className="text-[10px] text-text-secondary font-medium truncate">{stat.subtext}</span>
                    </div>

                    {stat.label === 'Progress' && (
                        <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: stat.value }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
