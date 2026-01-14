
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History,
    Search,
    Filter,
    Download,
    User,
    Activity,
    Monitor,
    Globe,
    ChevronRight,
    X,
    Calendar,
    Clock,
    UserCircle,
    Server,
    Database,
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';
import { AdminService } from '@/app/services/admin.service';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    performedBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
    };
    targetUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [page, selectedAction]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getAuditLogs(page, 50, searchQuery, selectedAction);
            setLogs(data.logs);
            setTotalPages(data.metadata.totalPages);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const getRiskLevel = (action: string) => {
        const criticalActions = ['DELETE_PROJECT', 'DELETE_WORKSPACE', 'ROLE_PERMISSIONS_UPDATED'];
        const warningActions = ['USER_UPDATED', 'WORKSPACE_STATUS_UPDATED', 'ROLE_CREATED'];

        if (criticalActions.includes(action)) return 'CRITICAL';
        if (warningActions.includes(action)) return 'WARNING';
        return 'NORMAL';
    };

    const formatAction = (action: string) => {
        return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedLog ? 'mr-96' : ''}`}>
                <div className="p-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Activity & Audit Logs</h1>
                                <p className="text-text-secondary text-sm">System-wide immutable records for security and compliance.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-border hover:bg-foreground/[0.02] transition-all">
                                <Download className="w-4 h-4" />
                                Export JSON
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search by user, IP, action, or entity ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-foreground/[0.02] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <select
                            value={selectedAction}
                            onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                            className="px-4 py-2.5 bg-foreground/[0.02] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none cursor-pointer pr-10 relative"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                        >
                            <option value="">All Actions</option>
                            <option value="USER_UPDATED">User Updated</option>
                            <option value="WORKSPACE_STATUS_UPDATED">Workspace Status Updated</option>
                            <option value="ROLE_CREATED">Role Created</option>
                            <option value="ROLE_PERMISSIONS_UPDATED">Permissions Changed</option>
                        </select>
                        <button type="submit" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            Apply Filter
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02]">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02]">Actor</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02]">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02]">Target</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02]">IP Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02]">Result</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-foreground/[0.02] text-right">Det.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4 bg-foreground/[0.01]">
                                            <div className="h-10 bg-foreground/5 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-text-secondary">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-foreground/[0.03] flex items-center justify-center">
                                                <AlertCircle className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="font-medium italic">No audit logs found matching the criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const risk = getRiskLevel(log.action);
                                    return (
                                        <tr
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className={`group hover:bg-foreground/[0.02] cursor-pointer transition-all border-l-4 ${selectedLog?.id === log.id
                                                    ? 'bg-primary/[0.03] border-primary'
                                                    : risk === 'CRITICAL' ? 'border-red-500/50' : risk === 'WARNING' ? 'border-amber-500/50' : 'border-transparent'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-primary whitespace-nowrap font-mono tracking-tighter">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary opacity-60">
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {log.performedBy.firstName.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col min-w-[120px]">
                                                        <span className="text-sm font-semibold truncate">
                                                            {log.performedBy.firstName} {log.performedBy.lastName}
                                                        </span>
                                                        <span className="text-[11px] text-text-secondary truncate opacity-70">
                                                            {log.performedBy.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${risk === 'CRITICAL'
                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                                        : risk === 'WARNING'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20'
                                                            : 'bg-foreground/10 text-text-secondary border border-border'
                                                    }`}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-text-primary uppercase tracking-tight">
                                                        {log.entityType}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary font-mono truncate max-w-[150px] opacity-70">
                                                        {log.entityId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-text-secondary font-mono text-xs opacity-80">
                                                    <Globe className="w-3 h-3" />
                                                    {log.ipAddress || 'Internal'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Success</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight className={`w-4 h-4 ml-auto transition-all ${selectedLog?.id === log.id ? 'rotate-90 text-primary' : 'text-text-secondary opacity-40 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-border flex items-center justify-between bg-background/80 backdrop-blur-sm">
                    <p className="text-xs text-text-secondary font-medium">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-foreground/[0.04] disabled:opacity-50 transition-all"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-foreground/[0.04] disabled:opacity-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Detail Sidebar Area */}
            <AnimatePresence>
                {selectedLog && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-[64px] bottom-0 w-96 bg-background border-l border-border shadow-2xl z-40 flex flex-col"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between bg-foreground/[0.01]">
                            <h3 className="font-bold text-lg">Event Detail</h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-foreground/[0.04] border border-border">
                                        <Activity className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary opacity-60">Action Performed</p>
                                        <h4 className="font-bold text-base">{formatAction(selectedLog.action)}</h4>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-foreground/[0.02] border border-border/50">
                                        <div className="flex items-center gap-2 mb-1 text-text-secondary opacity-60">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">Date</span>
                                        </div>
                                        <p className="text-sm font-semibold">{new Date(selectedLog.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-foreground/[0.02] border border-border/50">
                                        <div className="flex items-center gap-2 mb-1 text-text-secondary opacity-60">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase">Time</span>
                                        </div>
                                        <p className="text-sm font-semibold">{new Date(selectedLog.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary opacity-60 flex items-center gap-2">
                                    <UserCircle className="w-3 h-3" /> Actor Data
                                </h5>
                                <div className="p-4 rounded-2xl border border-border bg-foreground/[0.01] space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {selectedLog.performedBy.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{selectedLog.performedBy.firstName} {selectedLog.performedBy.lastName}</p>
                                            <p className="text-xs text-text-secondary opacity-70">{selectedLog.performedBy.email}</p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[9px] font-bold text-text-secondary uppercase">Session IP</p>
                                            <p className="text-xs font-mono">{selectedLog.ipAddress || 'Internal'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-text-secondary uppercase">Role</p>
                                            <p className="text-xs font-bold text-primary">System Admin</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary opacity-60 flex items-center gap-2">
                                    <Database className="w-3 h-3" /> Entity Metadata
                                </h5>
                                <div className="p-4 rounded-2xl border border-border bg-foreground/[0.01] space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-secondary font-medium">Entity Type</span>
                                        <span className="font-bold px-2 py-0.5 rounded bg-foreground/10 uppercase tracking-tighter">{selectedLog.entityType}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-secondary font-medium">Entity ID</span>
                                        <span className="font-mono text-[10px] opacity-70 select-all">{selectedLog.entityId}</span>
                                    </div>
                                    {selectedLog.targetUser && (
                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                                            <span className="text-text-secondary font-medium">Target User</span>
                                            <span className="font-bold text-primary">{selectedLog.targetUser.firstName} {selectedLog.targetUser.lastName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pb-4">
                                <h5 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary opacity-60 flex items-center gap-2">
                                    <Monitor className="w-3 h-3" /> Raw Payload
                                </h5>
                                <div className="bg-[#020617] p-4 rounded-2xl border border-white/10">
                                    <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto custom-scrollbar">
                                        {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-foreground/[0.02]">
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/10 text-sm font-bold hover:bg-foreground/20 transition-all">
                                <ArrowUpRight className="w-4 h-4" />
                                Jump to Entity
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

