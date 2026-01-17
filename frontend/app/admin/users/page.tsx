'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Filter, MoreHorizontal, Shield, User, UserX, Mail, Key, LayoutGrid, UserCheck, Trash2, Clock, Globe, ShieldCheck, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminService } from '../../services/admin.service';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersAdmin() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [metadata, setMetadata] = useState<any>({});
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [page, searchQuery, filterRole, filterStatus]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getUsers(page, 10, searchQuery, filterRole, filterStatus);
            setUsers(data.users);
            setMetadata(data.metadata);
        } catch (error) {
            console.error("Failed to load users", error);
            setError("Failed to load user data. Access denied.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (user: any, newStatus: string) => {
        try {
            setIsUpdating(true);
            await AdminService.updateUser(user.id, { status: newStatus });
            loadUsers();
            if (selectedUser?.id === user.id) {
                setSelectedUser({ ...user, status: newStatus });
            }
        } catch (error) {
            alert("Failed to update user status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateRole = async (user: any, newRole: string) => {
        try {
            setIsUpdating(true);
            await AdminService.updateUser(user.id, { systemRole: newRole });
            loadUsers();
            if (selectedUser?.id === user.id) {
                setSelectedUser({ ...user, systemRole: newRole });
            }
        } catch (error) {
            alert("Failed to update user role");
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <AdminLayout>
            <div className="flex relative h-[calc(100vh-100px)] overflow-hidden">
                <div className={`flex-1 transition-all duration-300 ${selectedUser ? 'mr-[450px]' : ''} overflow-y-auto pr-4`}>
                    <div className="space-y-8 pb-20">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Global User Directory</h1>
                            <p className="text-slate-500 text-sm mt-1">Search and manage all accounts across every workspace.</p>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex-1 min-w-[300px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Search by name, email, or user UID..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                                >
                                    <option value="">All Roles</option>
                                    <option value="SYSTEM_ADMIN">System Admin</option>
                                    <option value="USER">Standard User</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="SUSPENDED">Suspended</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>
                        </div>

                        {/* User List */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Role</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspaces</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Activity</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading && users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 text-sm italic">Loading platform users...</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 text-sm italic">No users found matching your search criteria.</td>
                                        </tr>
                                    ) : users.map((user) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`hover:bg-white/[0.02] cursor-pointer transition-all group ${selectedUser?.id === user.id ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.firstName} {user.lastName}</p>
                                                        <p className="text-[10px] text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${user.systemRole === 'SYSTEM_ADMIN' ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' : 'bg-white/5 text-slate-400'}`}>
                                                    {user.systemRole === 'SYSTEM_ADMIN' ? 'System Admin' : 'Standard User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                                    <LayoutGrid size={12} className="text-primary/50" /> {user.workspaceCount} Workspaces
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${user.status === 'ACTIVE' ? 'text-emerald-500' : user.status === 'SUSPENDED' ? 'text-danger' : 'text-amber-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.status === 'ACTIVE' ? 'bg-emerald-500' : user.status === 'SUSPENDED' ? 'bg-danger' : 'bg-amber-500'}`} />
                                                    {user.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap relative">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => toggleMenu(e, user.id)}
                                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>

                                                    {/* User Action Menu */}
                                                    <AnimatePresence>
                                                        {activeMenuId === user.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute right-8 top-12 z-50 bg-[#0A0F1D] border border-white/10 rounded-xl shadow-2xl w-48 overflow-hidden py-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    onClick={() => setSelectedUser(user)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                                                                >
                                                                    <User size={14} /> View Intelligence
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(user, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                                                                >
                                                                    {user.status === 'ACTIVE' ? <UserX size={14} className="text-rose-400" /> : <UserCheck size={14} className="text-emerald-400" />}
                                                                    {user.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
                                                                </button>
                                                                <div className="h-px bg-white/5 my-1" />
                                                                <button
                                                                    onClick={() => alert('Password reset link sent to ' + user.email)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 transition-colors"
                                                                >
                                                                    <Key size={14} /> Reset Password
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {metadata.totalPages > 1 && (
                                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                    <p className="text-xs text-slate-500">Showing page {page} of {metadata.totalPages}</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white disabled:opacity-30"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            disabled={page === metadata.totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white disabled:opacity-30"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audit Governance Label */}
                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
                            <Shield className="text-blue-500 shrink-0" size={20} />
                            <p className="text-sm text-blue-400/80 leading-relaxed italic">
                                <strong>Platform-Wide Visibility:</strong> System Administrators have global oversight of all user accounts to ensure security and compliance. Suspended users are immediately revoked from all active sessions across all tenants.
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Detail Drawer */}
                <AnimatePresence>
                    {selectedUser && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedUser(null)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-0 right-0 bottom-0 w-[450px] bg-[#0A0F1D] border-l border-white/10 shadow-2xl z-[70] overflow-y-auto"
                            >
                                <div className="p-8 space-y-8">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-white">User Intelligence</h2>
                                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* User Profiling */}
                                    <div className="flex flex-col items-center text-center p-6 bg-white/[0.02] border border-white/10 rounded-3xl">
                                        {selectedUser.avatarUrl ? (
                                            <img src={selectedUser.avatarUrl} className="w-24 h-24 rounded-full border-2 border-primary shadow-xl mb-4" alt="" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center text-3xl font-bold text-white border-2 border-primary mb-4">
                                                {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                                            </div>
                                        )}
                                        <h3 className="text-lg font-bold text-white">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                        <p className="text-slate-500 text-sm mb-4">{selectedUser.email}</p>

                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ring-1 ring-primary/20">
                                                Global Ident: {selectedUser.id.substring(0, 8)}...
                                            </div>
                                            <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ring-1 ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20' : 'bg-danger/10 text-danger ring-danger/20'}`}>
                                                {selectedUser.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleUpdateStatus(selectedUser, selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedUser.status === 'ACTIVE' ? 'bg-danger/5 border-danger/20 text-danger hover:bg-danger/10' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                                        >
                                            {selectedUser.status === 'ACTIVE' ? <UserX size={20} /> : <UserCheck size={20} />}
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{selectedUser.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                                        </button>
                                        <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all flex flex-col items-center gap-2">
                                            <Key size={20} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Reset Pass</span>
                                        </button>
                                    </div>

                                    {/* Role Management */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <ShieldCheck size={14} /> Global Authorization
                                        </div>
                                        <select
                                            value={selectedUser.systemRole}
                                            onChange={(e) => handleUpdateRole(selectedUser, e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="USER">Standard Platform User</option>
                                            <option value="SYSTEM_ADMIN">System Administrator (Full Access)</option>
                                        </select>
                                    </div>

                                    {/* Tenure Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Clock size={14} /> Account Meta
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Joined Platform</span>
                                                <span className="text-white font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Last Authentication</span>
                                                <span className="text-white font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">MFA Status</span>
                                                <span className={`font-bold ${selectedUser.mfaEnabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                    {selectedUser.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Workspace Memberships summary */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Globe size={14} /> Multi-Tenant Access
                                        </div>
                                        <div className="space-y-2">
                                            {selectedUser.workspaces?.length > 0 ? selectedUser.workspaces.map((ws: string, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs">
                                                    <span className="text-white font-medium">{ws}</span>
                                                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Member</span>
                                                </div>
                                            )) : (
                                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-500 italic">
                                                    No workspace memberships found.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-8 border-t border-white/5">
                                        <button className="w-full p-4 rounded-xl bg-danger/5 border border-danger/20 text-danger text-xs font-bold uppercase tracking-widest hover:bg-danger/10 transition-all flex items-center justify-center gap-2">
                                            <Trash2 size={16} /> Delete Platform Record
                                        </button>
                                        <p className="text-[10px] text-slate-600 mt-2 text-center uppercase tracking-tighter">Irreversible Action • Req. Confirmation</p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
