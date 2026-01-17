
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Users,
    Globe,
    CheckSquare,
    ShieldCheck,
    HardDrive,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download,
    Calendar,
    Filter
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { AdminService } from '@/app/services/admin.service';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const stats = await AdminService.getPlatformStats();
            setData(stats);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-bold text-text-secondary italic uppercase tracking-widest">Aggregating platform intelligence...</p>
                </div>
            </div>
        );
    }

    const { kpis, growthData, storageUsage, workspaceInsights } = data;

    return (
        <div className="p-8 bg-background max-h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        System Analytics
                    </h1>
                    <p className="text-text-secondary font-medium">Real-time health, usage, and growth insights across the entire platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-foreground/[0.03] border border-border rounded-xl">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm font-bold">Last 30 Days</span>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all">
                        <Download className="w-4 h-4" />
                        Reports
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Workspaces', value: kpis.totalWorkspaces, icon: Globe, trend: '+5.2%', positive: true },
                    { label: 'Active Users', value: kpis.activeUsers, icon: Users, trend: '+12.5%', positive: true },
                    { label: 'Tasks Completed', value: kpis.totalTasks, icon: CheckSquare, trend: '-2.1%', positive: false },
                    { label: 'MFA Adoption', value: `${kpis.mfaRate}%`, icon: ShieldCheck, trend: '+8.0%', positive: true },
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={item.label}
                        className="p-6 rounded-3xl bg-foreground/[0.02] border border-border hover:bg-foreground/[0.04] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <item.icon className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="p-2.5 w-fit rounded-2xl bg-primary/10 text-primary mb-4">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1 opacity-70">{item.label}</h3>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-black">{item.value}</span>
                                    <div className={`flex items-center gap-0.5 text-xs font-bold mb-1 ${item.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {item.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                        {item.trend}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Growth Chart */}
                <div className="lg:col-span-2 p-8 rounded-[2rem] bg-foreground/[0.01] border border-border">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold">Workspace & User Growth</h3>
                            <p className="text-sm text-text-secondary">Daily signup and activation trends.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-xs font-bold opacity-70">Users</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold opacity-70">Workspaces</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWorkspaces" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888888' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888888' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#020617',
                                        borderRadius: '16px',
                                        border: '1px solid #ffffff11',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                                    }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="workspaces" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorWorkspaces)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Storage Distribution */}
                <div className="p-8 rounded-[2rem] bg-foreground/[0.01] border border-border flex flex-col">
                    <h3 className="text-lg font-bold mb-1">Infrastructure Load</h3>
                    <p className="text-sm text-text-secondary mb-8">Storage distribution by file type.</p>
                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={storageUsage}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {storageUsage.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black">1.2 TB</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Used</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {storageUsage.map((item: any, i: number) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-xs font-bold opacity-70">{item.name}</span>
                                <span className="text-xs font-bold ml-auto">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Workspace Insights Table */}
            <div className="p-8 rounded-[2rem] bg-foreground/[0.01] border border-border">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold">Global Workspace Performance</h3>
                        <p className="text-sm text-text-secondary">High-impact workspaces driving platform activity.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-foreground/10 text-xs font-bold uppercase tracking-tight">Active Benchmarks</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="pb-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-2">Workspace</th>
                                <th className="pb-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Growth Score</th>
                                <th className="pb-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Users</th>
                                <th className="pb-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Projects</th>
                                <th className="pb-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right pr-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {workspaceInsights.map((ws: any) => (
                                <tr key={ws.id} className="group hover:bg-foreground/[0.02] transition-colors">
                                    <td className="py-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                {ws.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{ws.name}</p>
                                                <p className="text-[10px] text-text-secondary opacity-60 font-mono tracking-tighter uppercase">{ws.id.slice(0, 12)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-4 w-48">
                                            <div className="flex-1 h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                                                    style={{ width: `${ws.activityScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black min-w-[30px]">{ws.activityScore}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm font-bold">{ws.members} <span className="text-[10px] opacity-40">Mbrs</span></span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm font-bold">{ws.projects} <span className="text-[10px] opacity-40">Proj</span></span>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <button className="p-2 rounded-lg bg-foreground/10 hover:bg-primary hover:text-white transition-all">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

