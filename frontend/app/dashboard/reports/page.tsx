'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, PieChart as PieChartIcon, TrendingUp,
    CheckCircle2, Clock, AlertTriangle, Users,
    Layers, Layout, Activity, Download, FileText, FileJson, FileCode, Loader2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useToast } from '../../components/ui/Toast';

interface Task {
    id: string;
    status: string;
    projectId: string;
    project: { name: string };
}

interface Project {
    id: string;
    name: string;
    _count: { tasks: number };
}

export default function ReportsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [stats, setStats] = useState<any>({
        statusData: [],
        projectData: [],
        totals: {
            projects: 0,
            tasks: 0,
            completed: 0,
            inProgress: 0
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            let workspaceId = localStorage.getItem('selectedWorkspaceId');

            if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
                const wsRes = await fetch('http://localhost:4000/workspaces/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const wsData = await wsRes.json();
                if (wsData.workspace) {
                    workspaceId = wsData.workspace.id;
                    localStorage.setItem('selectedWorkspaceId', wsData.workspace.id);
                }
            }

            if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
                setLoading(false);
                return;
            }

            const finalWorkspaceId = workspaceId as string;

            // Fetch tasks and projects
            const [tasksRes, projectsRes] = await Promise.all([
                fetch(`http://localhost:4000/tasks/search?workspaceId=${finalWorkspaceId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:4000/projects?organizationId=${finalWorkspaceId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (tasksRes.ok && projectsRes.ok) {
                const tasksData = await tasksRes.json();
                const projectsData = await projectsRes.json();

                const tasks: Task[] = tasksData.tasks || [];
                const projects: Project[] = projectsData.projects || [];

                // Process Status Data for Pie Chart
                const statusCounts = tasks.reduce((acc: any, task) => {
                    acc[task.status] = (acc[task.status] || 0) + 1;
                    return acc;
                }, {});

                const statusData = [
                    { name: 'To Do', value: statusCounts['TODO'] || 0, color: '#94a3b8' },
                    { name: 'In Progress', value: statusCounts['IN_PROGRESS'] || 0, color: '#4f46e5' },
                    { name: 'In Review', value: statusCounts['IN_REVIEW'] || 0, color: '#f59e0b' },
                    { name: 'Done', value: statusCounts['DONE'] || 0, color: '#10b981' },
                    { name: 'Blocked', value: statusCounts['BLOCKED'] || 0, color: '#ef4444' }
                ].filter(d => d.value > 0);

                // Process Project Data for Bar Chart
                const projectTaskData = projects.slice(0, 5).map(p => ({
                    name: p.name,
                    tasks: p._count.tasks,
                    completed: tasks.filter(t => t.projectId === p.id && t.status === 'DONE').length
                }));

                setStats({
                    statusData,
                    projectData: projectTaskData,
                    totals: {
                        projects: projects.length,
                        tasks: tasks.length,
                        completed: tasks.filter(t => t.status === 'DONE').length,
                        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch report data:', error);
            showToast('error', 'Error', 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleExportAnalytics = (format: 'json' | 'csv' | 'pdf') => {
        setIsExporting(true);
        if (format === 'pdf') {
            showToast('info', 'Preparing Analytics...', 'Optimal print view generated.');
            setTimeout(() => {
                window.print();
                setShowExportMenu(false);
                setIsExporting(false);
            }, 500);
            return;
        }

        try {
            showToast('info', 'Generating Data...', `Preparing ${format.toUpperCase()} export.`);
            const data = format === 'csv'
                ? generateCSV()
                : JSON.stringify(stats, null, 2);

            const blob = new Blob([data], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `workspace_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);

            setShowExportMenu(false);
            showToast('success', 'Export Complete', `${format.toUpperCase()} report downloaded successfully.`);
        } catch (error) {
            showToast('error', 'Export Failed', 'Could not generate the export file.');
        } finally {
            setIsExporting(false);
        }
    };

    const generateCSV = () => {
        const rows = [
            ['"Workspace Analytics Report"'],
            ['"Generated"', `"${new Date().toISOString()}"`],
            [],
            ['"Summary Metrics"'],
            ['"Metric"', '"Value"'],
            ['"Active Projects"', `"${stats.totals.projects}"`],
            ['"Total Tasks"', `"${stats.totals.tasks}"`],
            ['"Tasks Completed"', `"${stats.totals.completed}"`],
            ['"Tasks In Progress"', `"${stats.totals.inProgress}"`],
            [],
            ['"Task Status Distribution"'],
            ['"Status"', '"Count"'],
            ...stats.statusData.map((s: any) => [`"${s.name}"`, `"${s.value}"`]),
            [],
            ['"Project Engagement"'],
            ['"Project"', '"Total Tasks"', '"Completed"'],
            ...stats.projectData.map((p: any) => [`"${p.name}"`, `"${p.tasks}"`, `"${p.completed}"`])
        ];
        return rows.map(row => row.join(',')).join('\n');
    };

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

    return (
        <DashboardLayout>
            <style jsx global>{`
                @media print {
                    aside, nav, .no-print, button { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; color: black !important; }
                    .max-w-7xl { max-width: 100% !important; padding: 0 !important; }
                    .shadow-lg, .shadow-xl { shadow: none !important; border: 1px solid #eee !important; }
                    .p-6, .p-8 { padding: 0 !important; }
                }
            `}</style>
            <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">Reports & Analytics</h1>
                        <p className="text-text-secondary text-sm">Visual insights into your team's productivity</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-surface/40 hover:bg-surface-secondary border border-border rounded-xl text-text-primary text-sm font-medium transition-all"
                        >
                            <Activity size={16} className="text-primary" />
                            Refresh Data
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20"
                            >
                                <Download size={16} />
                                Export
                            </button>
                            {showExportMenu && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-text-secondary uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1.5 flex justify-between items-center">
                                        <span>Select Format</span>
                                        {isExporting && <Loader2 size={10} className="animate-spin text-primary" />}
                                    </div>
                                    <button
                                        onClick={() => handleExportAnalytics('json')}
                                        disabled={isExporting}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary text-sm text-slate-600 dark:text-text-secondary transition-all flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                            <FileJson size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">JSON Data</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleExportAnalytics('csv')}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary text-sm text-slate-600 dark:text-text-secondary transition-all flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                            <FileText size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">CSV Spreadsheet</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleExportAnalytics('pdf')}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary text-sm text-slate-600 dark:text-text-secondary transition-all flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                            <FileCode size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">PDF Print</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Active Projects', value: stats.totals.projects, icon: Layout, color: 'text-primary' },
                                { label: 'Total Tasks', value: stats.totals.tasks, icon: Layers, color: 'text-indigo-400' },
                                { label: 'Tasks Completed', value: stats.totals.completed, icon: CheckCircle2, color: 'text-emerald-400' },
                                { label: 'In Progress', value: stats.totals.inProgress, icon: Clock, color: 'text-amber-400' }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 bg-surface/40 border border-border rounded-2xl shadow-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{card.label}</span>
                                        <card.icon className={`w-4 h-4 ${card.color}`} />
                                    </div>
                                    <div className="text-2xl font-bold text-text-primary">{card.value}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                            {/* Status Distribution */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 bg-surface/40 border border-border rounded-3xl flex flex-col min-h-[400px]"
                            >
                                <div className="flex items-center gap-2 mb-6 text-text-primary font-bold tracking-tight">
                                    <PieChartIcon size={20} className="text-primary" />
                                    Task Status Distribution
                                </div>
                                <div className="h-[300px] w-full mt-auto">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.statusData.map((entry: any) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '12px',
                                                    color: 'var(--color-text-primary)'
                                                }}
                                                itemStyle={{ fontSize: '12px', color: 'var(--color-text-primary)' }}
                                            />
                                            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px', color: 'var(--color-text-secondary)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Project Progress */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="p-8 bg-surface/40 border border-border rounded-3xl flex flex-col min-h-[400px]"
                            >
                                <div className="flex items-center gap-2 mb-6 text-text-primary font-bold tracking-tight">
                                    <TrendingUp size={20} className="text-emerald-500" />
                                    Project Engagement (Top 5)
                                </div>
                                <div className="h-[300px] w-full mt-auto text-slate-400">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.projectData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} opacity={0.2} />
                                            <XAxis type="number" stroke="var(--color-text-secondary)" fontSize={10} />
                                            <YAxis dataKey="name" type="category" stroke="var(--color-text-secondary)" fontSize={10} width={100} />
                                            <Tooltip
                                                cursor={{ fill: 'var(--color-surface-secondary)', opacity: 0.4 }}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '12px',
                                                    color: 'var(--color-text-primary)'
                                                }}
                                                itemStyle={{ color: 'var(--color-text-primary)' }}
                                            />
                                            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar name="Total Tasks" dataKey="tasks" fill="var(--color-primary)" opacity={0.6} radius={[0, 4, 4, 0]} />
                                            <Bar name="Completed" dataKey="completed" fill="var(--color-success)" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout >
    );
}
