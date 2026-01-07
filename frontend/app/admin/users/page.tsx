'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Filter, MoreHorizontal, Shield, UserX, Mail, Key, LayoutGrid } from 'lucide-react';

const users = [
    { name: 'Sarah Jeon', email: 'sarah.j@technova.com', status: 'Active', workspaces: 3, lastLogin: '2 mins ago', role: 'Enterprise Admin' },
    { name: 'Mike Ross', email: 'mike.r@gmail.com', status: 'Active', workspaces: 1, lastLogin: '1 hour ago', role: 'User' },
    { name: 'Harvey Specter', email: 'law@specter.com', status: 'Suspended', workspaces: 2, lastLogin: '3 days ago', role: 'User' },
    { name: 'Donna Paulsen', email: 'donna@hq.com', status: 'Active', workspaces: 5, lastLogin: 'Just now', role: 'System Admin' },
];

export default function UsersAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Global User Directory</h1>
                    <p className="text-slate-500 text-sm mt-1">Search and manage all accounts across every workspace.</p>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Search by name, email, or user UID..."
                        />
                    </div>
                    <button className="px-4 py-2.5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all flex items-center gap-2">
                        <Filter size={16} /> Filter
                    </button>
                </div>

                {/* User List */}
                <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Type</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspaces</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Activity</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user, i) => (
                                <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{user.name}</p>
                                                <p className="text-[10px] text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'System Admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-slate-400'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <LayoutGrid size={12} /> {user.workspaces} Workspaces
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{user.lastLogin}</td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'Active' ? 'text-emerald-500' : 'text-danger'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-danger'}`} />
                                            {user.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors" title="Force Logout">
                                                <Key size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-danger transition-colors" title="Suspend Account">
                                                <UserX size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Audit Rule */}
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                    <p className="text-sm text-blue-400/80 leading-relaxed italic">
                        <strong>Security Governance:</strong> As a System Admin, you can access global user records for audit purposes. Direct modification of user content within workspaces is restricted to maintain data privacy boundaries.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
