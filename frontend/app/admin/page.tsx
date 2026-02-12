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
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AdminService, AdminStats } from '../services/admin.service';

interface SystemAlert {
    id: string;
    title: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    createdAt: string;
}


const systemServices = [
    { name: 'API Server', status: 'Healthy', uptime: '99.99%', load: '12%', color: 'emerald' },
    { name: 'Background Jobs', status: 'Processing', uptime: '100%', load: '4%', color: 'blue' },
    { name: 'Email Delivery (Brevo)', status: 'Operational', uptime: '99.8%', load: '2%', color: 'emerald' },
    { name: 'Push Notifications', status: 'Maintenance', uptime: '98.5%', load: '-', color: 'amber' },
];


export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const data = await AdminService.getAlerts();
            setAlerts(data || []);
        } catch (error) {
            console.error("Failed to load alerts", error);
        }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            await AdminService.acknowledgeAlert(id);
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (error) {
            console.error("Failed to acknowledge alert", error);
        }
    };

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
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Platform Overview</h1>
                    <p className="text-text-secondary text-sm mt-1">Real-time health and operational status of the entire system.</p>
                </div>

                {/* Health Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {healthCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl bg-foreground/[0.03] ${card.color}`}>
                                    <card.icon size={20} />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.trend.includes('+') ? 'bg-success/10 text-success' : 'bg-foreground/[0.03] text-text-secondary'} uppercase tracking-wider`}>
                                    {card.trend}
                                </span>
                            </div>
                            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest">{card.label}</h3>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-text-primary">{card.value}</span>
                                <ArrowUpRight size={14} className="text-success" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* System Status */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <Activity size={18} className="text-primary" />
                                System Services
                            </h2>
                            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Advanced Metrics</button>
                        </div>
                        <div className="bg-surface border border-border rounded-3xl overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-foreground/[0.02] border-b border-border">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Service</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Uptime</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Load</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {systemServices.map((service) => (
                                        <tr key={service.name} className="hover:bg-foreground/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${service.color === 'emerald' ? 'bg-success' : service.color === 'blue' ? 'bg-primary' : 'bg-warning'}`} />
                                                    <span className="text-sm font-medium text-text-primary">{service.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 ${service.color === 'emerald' ? 'bg-success/10 text-success' : service.color === 'blue' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                                                    {service.status === 'Healthy' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                                    {service.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">{service.uptime}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-foreground/[0.05] rounded-full overflow-hidden w-20">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                                            style={{ width: service.load === '-' ? '0%' : service.load }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-text-secondary font-mono">{service.load}</span>
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
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <History size={18} className="text-primary" />
                                Audit Log
                            </h2>
                        </div>
                        <div className="bg-surface border border-border rounded-3xl p-6 space-y-6">
                            {stats && stats.recentActivity && stats.recentActivity.map((log, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-border flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
                                        <Terminal size={16} className="text-text-secondary group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-bold text-text-primary truncate">{log.action}</p>
                                            <span className="text-[10px] text-text-secondary whitespace-nowrap">{new Date(log.time).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-text-secondary truncate">
                                            <span className="text-primary font-medium">{log.user}</span> → {log.target}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!stats || !stats.recentActivity || stats.recentActivity.length === 0) && (
                                <div className="text-center text-text-secondary text-sm py-4">No recent activity</div>
                            )}
                            <button className="w-full py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border rounded-xl text-xs font-bold text-text-primary transition-all uppercase tracking-widest">
                                View Full Audit Trail
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Alerts Strip */}
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`rounded-2xl p-4 flex items-center justify-between mb-4 border ${alert.severity === 'CRITICAL' ? 'bg-danger/10 border-danger/20 text-danger' :
                                alert.severity === 'WARNING' ? 'bg-warning/10 border-warning/20 text-warning' :
                                    'bg-primary/10 border-primary/20 text-primary'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-danger/20' :
                                    alert.severity === 'WARNING' ? 'bg-warning/20' :
                                        'bg-primary/20'
                                    }`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{alert.title}</p>
                                    <p className="text-xs opacity-80">{alert.message}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAcknowledge(alert.id)}
                                className={`px-4 py-2 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${alert.severity === 'CRITICAL' ? 'bg-danger text-white hover:bg-danger/90' :
                                    alert.severity === 'WARNING' ? 'bg-warning text-white hover:bg-warning/90' :
                                        'bg-primary text-white hover:bg-primary/90'
                                    }`}
                            >
                                Acknowledge
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
