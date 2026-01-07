'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Globe, Plus, Search, Filter, MoreHorizontal, Shield, Users as UsersIcon, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

const workspaces = [
    { name: 'Tech-Nova Ltd', owner: 'sarah.j@technova.com', plan: 'Enterprise', users: 45, storage: '12.4 GB', status: 'Active' },
    { name: 'Creative Hub', owner: 'mike.creative@gmail.com', plan: 'Business', users: 12, storage: '2.1 GB', status: 'Active' },
    { name: 'Global Logistics', owner: 'ops@globallog.com', plan: 'Enterprise', users: 89, storage: '45.8 GB', status: 'Suspended' },
    { name: 'Startup Inc', owner: 'founder@startup.io', plan: 'Free', users: 3, storage: '0.5 GB', status: 'Active' },
];

export default function WorkspacesAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Global control of all customer workspaces and lifecycles.</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/25">
                        <Plus size={18} />
                        New System Provision
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Search by workspace name, owner email or ID..."
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white appearance-none focus:outline-none">
                            <option>All Plans</option>
                            <option>Enterprise</option>
                            <option>Business</option>
                            <option>Free</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white appearance-none focus:outline-none">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Suspended</option>
                            <option>Pending</option>
                        </select>
                    </div>
                </div>

                {/* table */}
                <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Owner</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacity</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {workspaces.map((ws, i) => (
                                <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {ws.name[0]}
                                            </div>
                                            <span className="text-sm font-bold text-white">{ws.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{ws.owner}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ws.plan === 'Enterprise' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-400'}`}>
                                            {ws.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <UsersIcon size={12} /> {ws.users} Users
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <HardDrive size={10} /> {ws.storage}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${ws.status === 'Active' ? 'text-emerald-500' : 'text-danger'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${ws.status === 'Active' ? 'bg-emerald-500' : 'bg-danger'}`} />
                                            {ws.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Capacity Advisory */}
                <div className="flex items-center justify-between p-6 rounded-3xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <Plus size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-white">Scale Global Provisioning</p>
                            <p className="text-sm text-slate-400">Increase system-wide workspace limits or adjust base roles.</p>
                        </div>
                    </div>
                    <button className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all">Configure Provisioning</button>
                </div>
            </div>
        </AdminLayout>
    );
}
