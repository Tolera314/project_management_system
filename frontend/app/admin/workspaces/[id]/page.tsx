'use client';

import AdminLayout from '../../../components/admin/AdminLayout';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AdminService } from '../../../services/admin.service';
import {
    LayoutDashboard, Users, FolderKanban, ShieldAlert, History,
    ArrowLeft, Globe, Clock, ShieldCheck, Mail, Target,
    HardDrive, Ban, CheckCircle, Trash2, Key, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceDetailAdmin() {
    const { id } = useParams();
    const router = useRouter();
    const [workspace, setWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (id) loadWorkspace();
    }, [id]);

    const loadWorkspace = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getWorkspaceDetail(id as string);
            setWorkspace(data);
        } catch (error) {
            console.error("Failed to load workspace detail", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            await AdminService.updateWorkspaceStatus(id as string, status);
            loadWorkspace();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[500px] text-slate-500 italic">
                Scanning workspace structure...
            </div>
        </AdminLayout>
    );

    if (!workspace) return (
        <AdminLayout>
            <div className="text-center py-20">
                <ShieldAlert size={48} className="mx-auto text-danger mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Workspace Not Found</h2>
                <button onClick={() => router.back()} className="mt-4 text-primary text-sm font-bold flex items-center gap-2 mx-auto">
                    <ArrowLeft size={16} /> Return to Global Registry
                </button>
            </div>
        </AdminLayout>
    );

    const tabs = [
        { id: 'overview', label: 'Intelligence', icon: LayoutDashboard },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'security', label: 'Security & Policy', icon: ShieldCheck },
        { id: 'audit', label: 'Audit Logs', icon: History },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Breadcrumbs & Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-500">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="h-6 w-px bg-white/10" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Workspace ID:</span>
                                <code className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-mono">{workspace.id}</code>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                {workspace.name}
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ring-1 ring-emerald-500/20 tracking-wider">
                                    {workspace.status || 'Active'}
                                </span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleUpdateStatus('SUSPENDED')}
                            className="bg-danger/10 text-danger border border-danger/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-danger/20 transition-all flex items-center gap-2"
                        >
                            <Ban size={14} /> Suspend Workspace
                        </button>
                        <button className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-2">
                            System Audit
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-1 border-b border-white/5 pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="admintab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Members</p>
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="text-3xl font-bold text-white">{workspace._count?.members}</h3>
                                            <Users size={20} className="text-primary/50" />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Projects</p>
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="text-3xl font-bold text-white">{workspace._count?.projects}</h3>
                                            <FolderKanban size={20} className="text-primary/50" />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Storage Intake</p>
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="text-3xl font-bold text-white">4.2 GB</h3>
                                            <HardDrive size={20} className="text-primary/50" />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Plan</p>
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="text-3xl font-bold text-white">PRO</h3>
                                            <Target size={20} className="text-primary/50" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/5 p-8 rounded-3xl space-y-6">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">Lifecycle Overview</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Provisioned On</p>
                                                <p className="text-sm text-white">{new Date(workspace.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status Registry</p>
                                                <p className="text-sm text-emerald-500 font-bold">HEALTHY</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Primary Region</p>
                                                <p className="text-sm text-white">US-East (Primary)</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Compliance Level</p>
                                                <p className="text-sm text-primary font-bold">EDR Enabled</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 p-8 rounded-3xl space-y-6">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">Ownership Matrix</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white border border-white/10">
                                                A
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Primary Accountable</p>
                                                <p className="text-xs text-slate-400">admin@org.com (Registered Owner)</p>
                                            </div>
                                            <button className="ml-auto px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase">Transfer</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'members' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Individual</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Role</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Join Date</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Control</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {workspace.members?.map((member: any) => (
                                                <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-white/10">
                                                                {member.user.firstName[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white">{member.user.firstName} {member.user.lastName}</p>
                                                                <p className="text-[10px] text-slate-500">{member.user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-white/5 rounded-lg border border-white/10 italic">
                                                            {member.role?.name || 'Member'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${member.user.mfaEnabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                            {member.user.mfaEnabled ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                                            {member.user.mfaEnabled ? 'MFA VERIFIED' : 'NO MFA'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-500 italic">
                                                        {new Date(member.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase transition-colors">Adjust Access</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'projects' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {workspace.projects?.map((project: any) => (
                                        <div key={project.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-primary/50 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                                <button className="text-danger"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-primary border border-primary/20 bg-primary/10">
                                                <Target size={24} />
                                            </div>
                                            <h4 className="text-white font-bold mb-1">{project.name}</h4>
                                            <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-widest italic">{project._count.tasks} Global Tasks</p>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter flex items-center gap-1">
                                                    <Clock size={10} /> Active
                                                </div>
                                                <button className="text-[10px] font-bold text-primary uppercase hover:underline">Inspect Details</button>
                                            </div>
                                        </div>
                                    ))}
                                    {workspace.projects?.length === 0 && (
                                        <div className="col-span-3 text-center py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                                            <p className="text-slate-500 text-sm">No project blueprints found in this workspace.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-primary" /> Governance Policies
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">Platform enforcement overrides local workspace settings to ensure system-wide compliance.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { title: 'Enforce Global MFA', desc: 'All members must use Multi-Factor Authentication for access.', status: 'Inactive', action: 'Enable Enforcement' },
                                        { title: 'Session Timeout', desc: 'Auto-revoke access after 30 minutes of global inactivity.', status: '12h Active', action: 'Override' },
                                        { title: 'IP Boundary Control', desc: 'Restrict workspace access to specified CIDR blocks.', status: 'Disabled', action: 'Set Boundary' },
                                        { title: 'Data Retention', desc: 'Platform-level archival of projects deleted by users.', status: '30 Days', action: 'Adjust' },
                                    ].map((policy, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.08] transition-all">
                                            <div>
                                                <p className="text-sm font-bold text-white">{policy.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">{policy.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{policy.status}</span>
                                                <button className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter">{policy.action}</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'audit' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={18} className="text-blue-500" /> Workspace-Scoped Events
                                    </h4>
                                    <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase px-3 py-1.5 border border-white/10 rounded-lg">Export CSV</button>
                                </div>
                                <div className="bg-[#020617] border border-white/5 rounded-3xl p-6 space-y-4 font-mono">
                                    <div className="flex gap-4 text-[11px] leading-relaxed">
                                        <span className="text-slate-600 shrink-0">[2026-01-14 10:05:22]</span>
                                        <span className="text-emerald-500 shrink-0">AUTH_SUCCESS</span>
                                        <span className="text-slate-400">User <code className="text-white">admin@org.com</code> authenticated via primary SSO provider.</span>
                                    </div>
                                    <div className="flex gap-4 text-[11px] leading-relaxed">
                                        <span className="text-slate-600 shrink-0">[2026-01-14 09:12:45]</span>
                                        <span className="text-blue-500 shrink-0">POLICY_UPDATE</span>
                                        <span className="text-slate-400">Retention policy updated to <code className="text-white">30d</code> by System Admin <code className="text-indigo-400">ROOT_ADMIN_01</code>.</span>
                                    </div>
                                    <div className="flex gap-4 text-[11px] leading-relaxed">
                                        <span className="text-slate-600 shrink-0">[2026-01-13 22:30:10]</span>
                                        <span className="text-amber-500 shrink-0">ACCESS_INVITE</span>
                                        <span className="text-slate-400">External invitation issued to <code className="text-white">contractor@gmail.com</code> with role <code className="text-amber-400">MEMBER</code>.</span>
                                    </div>
                                    <div className="flex gap-4 text-[11px] leading-relaxed italic opacity-50">
                                        <span className="text-slate-600 shrink-0">... older records archived following system policy ...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AdminLayout>
    );
}
