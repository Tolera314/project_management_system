'use client';

import AdminLayout from '../components/admin/AdminLayout';
import {
    Globe,
    Users,
    LayoutGrid,
    HardDrive,
    Activity,
    CheckCircle2,
    AlertTriangle,
    Zap,
    ArrowUpRight,
    History,
    Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AdminService, AdminStats } from '../services/admin.service';


const systemServices = [
    { name: 'API Server', status: 'Healthy', uptime: '99.99%', load: '12%', color: 'emerald' },
    { name: 'Background Jobs', status: 'Processing', uptime: '100%', load: '4%', color: 'blue' },
    { name: 'Email Delivery (Brevo)', status: 'Operational', uptime: '99.8%', load: '2%', color: 'emerald' },
    { name: 'Push Notifications', status: 'Maintenance', uptime: '98.5%', load: '-', color: 'amber' },
];

const recentActivity = [
    { action: 'Workspace Created', target: 'Tech-Nova Ltd', user: 'Sarah Jeon', time: '2 mins ago' },
    { action: 'Permission Modified', target: 'Role: Editor', user: 'Master Admin', time: '14 mins ago' },
    { action: 'Security Alert', target: 'Failed Login Threshold', user: 'System', time: '45 mins ago' },
    { action: 'Database Backup', target: 'Auto-Backup Success', user: 'System', time: '1 hour ago' },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await AdminService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load admin stats", error);
        } finally {
            setLoading(false);
        }
    };

    const healthCards = stats ? [
        { label: 'Total Workspaces', value: stats.workspaces.total.toString(), icon: Globe, color: 'text-blue-500', trend: `+${stats.workspaces.growth}%` },
        { label: 'Active Users', value: stats.users.total.toString(), icon: Users, color: 'text-purple-500', trend: `+${stats.users.growth}%` },
        { label: 'Total Projects', value: stats.projects.total.toString(), icon: LayoutGrid, color: 'text-emerald-500', trend: '+' },
        { label: 'Revenue', value: '$0', icon: HardDrive, color: 'text-amber-500', trend: 'N/A' },
    ] : [];

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time health and operational status of the entire system.</p>
                </div>

                {/* Health Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {healthCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl bg-white/5 ${card.color}`}>
                                    <card.icon size={20} />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-400'} uppercase tracking-wider`}>
                                    {card.trend}
                                </span>
                            </div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{card.label}</h3>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">{card.value}</span>
                                <ArrowUpRight size={14} className="text-emerald-500" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* System Status */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity size={18} className="text-primary" />
                                System Services
                            </h2>
                            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Advanced Metrics</button>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uptime</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Load</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {systemServices.map((service) => (
                                        <tr key={service.name} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full animate-pulse bg-${service.color}-500`} />
                                                    <span className="text-sm font-medium text-white">{service.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg bg-${service.color}-500/10 text-${service.color}-500 inline-flex items-center gap-1.5`}>
                                                    {service.status === 'Healthy' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                                    {service.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">{service.uptime}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-20">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                                            style={{ width: service.load === '-' ? '0%' : service.load }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-mono">{service.load}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <History size={18} className="text-primary" />
                                Audit Log
                            </h2>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                            {recentActivity.map((log, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
                                        <Terminal size={16} className="text-slate-500 group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-bold text-white truncate">{log.action}</p>
                                            <span className="text-[10px] text-slate-500 whitespace-nowrap">{log.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate">
                                            <span className="text-primary font-medium">{log.user}</span> → {log.target}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest">
                                View Full Audit Trail
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Alerts Strip */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">System Advisory</p>
                            <p className="text-xs text-amber-500/80">Scheduled maintenance for 'Push Notifications' node in 4 hours. No downtime expected.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-amber-500 text-[#020617] text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-amber-400 transition-colors">Acknowledge</button>
                </div>
            </div>
        </AdminLayout>
    );
}
