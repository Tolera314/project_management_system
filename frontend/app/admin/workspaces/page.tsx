'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Globe, Plus, Search, Filter, MoreHorizontal, Shield, Users as UsersIcon, HardDrive, Trash, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AdminService, WorkspaceData } from '../../services/admin.service';
import Link from 'next/link';
import ProvisionModal from '../../components/admin/ProvisionModal';

export default function WorkspacesAdmin() {
    const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [metadata, setMetadata] = useState<any>({});
    const [activeActionId, setActiveActionId] = useState<string | null>(null);
    const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

    useEffect(() => {
        loadWorkspaces();
    }, [page, searchQuery]);

    const loadWorkspaces = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await AdminService.getWorkspaces(page, 10, searchQuery);
            setWorkspaces(data.workspaces);
            setMetadata(data.metadata);
        } catch (error: any) {
            console.error("Failed to load workspaces", error);
            setError("Failed to load data. Ensure you have System Admin privileges.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

    const toggleActions = (id: string) => {
        setActiveActionId(activeActionId === id ? null : id);
    };

    const handleSuspend = async (id: string, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
            await AdminService.updateWorkspaceStatus(id, nextStatus);
            loadWorkspaces();
            setActiveActionId(null);
        } catch (error) {
            alert("Action failed. Check admin permissions.");
        }
    };

    // Close actions when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveActionId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Workspace Management</h1>
                        <p className="text-text-secondary text-sm mt-1">Global control of all customer workspaces and lifecycles.</p>
                    </div>
                    <button
                        onClick={() => setIsProvisionModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/25"
                    >
                        <Plus size={18} />
                        New System Provision
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface p-4 rounded-2xl border border-border">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <input
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Search by workspace name, owner email or ID..."
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <select className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary appearance-none focus:outline-none cursor-pointer">
                            <option>All Plans</option>
                            <option>Enterprise</option>
                            <option>Business</option>
                            <option>Free</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <select className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary appearance-none focus:outline-none cursor-pointer">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Suspended</option>
                            <option>Pending</option>
                        </select>
                    </div>
                </div>

                {/* table */}
                <div className="bg-surface border border-border rounded-3xl overflow-hidden min-h-[400px]">
                    {loading && workspaces.length === 0 ? (
                        <div className="flex items-center justify-center h-[400px] text-slate-500 italic">Interrogating global registry...</div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-rose-500 gap-2">
                            <Shield size={48} className="text-rose-500/50 mb-2" />
                            <p className="font-bold">{error}</p>
                            <p className="text-sm text-slate-500">Please log in with an admin account.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-surface-secondary border-b border-border">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Workspace</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Owner</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Plan</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Capacity</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-text-secondary uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-text-secondary uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {workspaces.map((ws) => (
                                    <tr key={ws.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/workspaces/${ws.id}`} className="flex items-center gap-3 group/link">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold group-hover/link:bg-primary group-hover/link:text-white transition-all">
                                                    {ws.name[0]}
                                                </div>
                                                <span className="text-sm font-bold text-text-primary group-hover/link:text-primary transition-colors">{ws.name}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-primary tracking-tight">{ws.owner}</span>
                                                <span className="text-[10px] text-text-secondary font-medium">{ws.ownerEmail}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ws.plan === 'Enterprise' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-400'}`}>
                                                {ws.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                    <UsersIcon size={12} className="text-primary/50" /> {ws.members} Users
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                                    <HardDrive size={10} /> {ws.projects} Projects
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${ws.status === 'ACTIVE' ? 'text-emerald-500' : 'text-danger'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${ws.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-danger'}`} />
                                                {ws.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleActions(ws.id);
                                                }}
                                                className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Actions Menu */}
                                            <AnimatePresence>
                                                {activeActionId === ws.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-8 top-8 z-50 bg-surface border border-border rounded-xl shadow-xl w-48 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="p-1">
                                                            <Link href={`/admin/workspaces/${ws.id}`} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-surface-secondary rounded-lg transition-colors">
                                                                <Globe size={14} /> View Details
                                                            </Link>
                                                            <button
                                                                onClick={() => handleSuspend(ws.id, ws.status)}
                                                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
                                                            >
                                                                <Ban size={14} /> {ws.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
                                                            </button>
                                                            <div className="h-px bg-border my-1" />
                                                            <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                <Trash size={14} /> Delete Permanently
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination stub */}
                    {metadata.totalPages > 1 && (
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                            <p className="text-xs text-slate-500">Global Registry Page {page} of {metadata.totalPages}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-30">Prev</button>
                                <button onClick={() => setPage(p => p + 1)} disabled={page === metadata.totalPages} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-30">Next</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Capacity Advisory */}
                <div className="flex items-center justify-between p-6 rounded-3xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                            <Plus size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-text-primary">Scale Global Provisioning</p>
                            <p className="text-sm text-text-secondary">Increase system-wide workspace limits or adjust base roles.</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/provisioning/settings"
                        className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center"
                    >
                        Configure Provisioning
                    </Link>
                </div>

                <ProvisionModal
                    isOpen={isProvisionModalOpen}
                    onClose={() => setIsProvisionModalOpen(false)}
                    onSuccess={() => loadWorkspaces()}
                />
            </div>
        </AdminLayout>
    );
}
