'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    AlertCircle,
    TrendingUp,
    Users
} from 'lucide-react';
import { ProjectService } from '../../services/project.service';

interface ProjectOverviewStripProps {
    project: any;
}

export default function ProjectOverviewStrip({ project }: ProjectOverviewStripProps) {
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!project?.id) return;
            try {
                const data = await ProjectService.getProjectStats(project.id);
                setStatsData(data);
            } catch (error) {
                console.error('Failed to fetch project stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [project?.id]);

    const stats = [
        {
            label: 'Progress',
            value: statsData ? `${statsData.progress}%` : '0%',
            subtext: 'Overall completion',
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            label: 'Open Tasks',
            value: statsData ? statsData.openTasks : 0,
            subtext: 'Needs attention',
            icon: Circle,
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            label: 'Overdue',
            value: statsData ? statsData.overdueTasks : 0,
            subtext: 'High priority',
            icon: AlertCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        },
        {
            label: 'Members',
            value: statsData ? statsData.totalMembers : (project.members?.length || 0),
            subtext: 'Active & invited',
            icon: Users,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            label: 'Velocity',
            value: statsData ? `${statsData.velocity.value}%` : '0%',
            subtext: statsData ? (statsData.velocity.direction === 'up' ? 'Increase vs last week' : 'Decrease vs last week') : 'VS last week',
            icon: TrendingUp,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 bg-surface/30 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

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
                                animate={{ width: statsData ? `${statsData.progress}%` : '0%' }}
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
