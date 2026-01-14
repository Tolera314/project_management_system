'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Filter, MoreHorizontal, Shield, UserX, Key, LayoutGrid, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminService, UserData } from '../../services/admin.service';
import UserDetailModal from '../../components/admin/UserDetailModal';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import FilterModal, { FilterValues } from '../../components/admin/FilterModal';
import { useUser } from '../../context/UserContext';

export default function UsersAdmin() {
    const { user: currentUser } = useUser();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // Modals
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState<FilterValues>({
        role: 'ALL',
        status: 'ALL',
        mfaEnabled: '',
        minWorkspaces: ''
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => void;
        isDangerous?: boolean;
    }>({ isOpen: false, title: '', message: '', action: () => {}, isDangerous: false });

    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [page, searchQuery, filters]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const filterParams: any = {
                q: searchQuery
            };

            if (filters.role && filters.role !== 'ALL') {
                filterParams.role = filters.role;
            }
            if (filters.status && filters.status !== 'ALL') {
                filterParams.status = filters.status;
            }
            if (filters.mfaEnabled) {
                filterParams.mfaEnabled = filters.mfaEnabled === 'true';
            }
            if (filters.minWorkspaces) {
                filterParams.minWorkspaces = parseInt(filters.minWorkspaces);
            }

            const { users: fetchedUsers, metadata } = await AdminService.getUsers(page, limit, filterParams);
            setUsers(fetchedUsers);
            setTotalPages(metadata.totalPages);
            setTotal(metadata.total);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const handleFilterApply = (newFilters: FilterValues) => {
        setFilters(newFilters);
        setPage(1);
    };

    const handleSuspendUser = async (userId: string, userName: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Suspend User Account',
            message: `Suspend ${userName}'s account? They will be logged out and unable to access the platform.`,
            action: async () => {
                try {
                    setActionLoading(true);
                    await AdminService.updateUserStatus(userId, 'SUSPENDED');
                    await loadUsers();
                } catch (error: any) {
                    alert(error.response?.data?.error || 'Failed to suspend user');
                } finally {
                    setActionLoading(false);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            },
            isDangerous: true
        });
    };

    const handleActivateUser = async (userId: string, userName: string) => {
        try {
            await AdminService.updateUserStatus(userId, 'ACTIVE');
            await loadUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to activate user');
        }
    };

    const handleForceLogout = async (userId: string, userName: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Force Logout',
            message: `Revoke all active sessions for ${userName}? They will need to log in again.`,
            action: async () => {
                try {
                    setActionLoading(true);
                    await AdminService.forceLogoutUser(userId);
                    alert('User logged out successfully');
                } catch (error: any) {
                    alert(error.response?.data?.error || 'Failed to force logout');
                } finally {
                    setActionLoading(false);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            },
            isDangerous: false
        });
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete User',
            message: `Permanently delete ${userName}? This action cannot be undone. All user data will be removed.`,
            action: async () => {
                try {
                    setActionLoading(true);
                    await AdminService.deleteUser(userId);
                    await loadUsers();
                } catch (error: any) {
                    alert(error.response?.data?.error || 'Failed to delete user');
                } finally {
                    setActionLoading(false);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            },
            isDangerous: true
        });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SYSTEM_ADMIN': return 'bg-amber-500/10 text-amber-500';
            case 'SUPPORT': return 'bg-blue-500/10 text-blue-500';
            default: return 'bg-white/5 text-slate-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return 'text-emerald-500 bg-emerald-500/10';
            case 'SUSPENDED': return 'text-red-500 bg-red-500/10';
            case 'PENDING': return 'text-amber-500 bg-amber-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Global User Directory</h1>
                    <p className="text-slate-500 text-sm mt-1">Search and manage all accounts across every workspace. Total: {total}</p>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Search by name, email, or user ID..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="px-4 py-2.5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                        <Filter size={16} /> Filter
                    </button>
                </div>

                {/* User List */}
                {loading ? (
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center">
                        <p className="text-slate-400">No users found</p>
                    </div>
                ) : (
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
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-white/[0.01] transition-colors cursor-pointer"
                                        onClick={() => setSelectedUserId(user.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{user.name}</p>
                                                    <p className="text-[10px] text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getRoleColor(user.systemRole)}`}>
                                                {user.systemRole.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <LayoutGrid size={12} /> {user.workspaceCount} Workspace{user.workspaceCount !== 1 ? 's' : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full w-fit ${getStatusColor(user.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {user.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleForceLogout(user.id, user.name)}
                                                    disabled={user.id === currentUser?.id}
                                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Force Logout"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                {user.status === 'ACTIVE' ? (
                                                    <button
                                                        onClick={() => handleSuspendUser(user.id, user.name)}
                                                        disabled={user.id === currentUser?.id}
                                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Suspend Account"
                                                    >
                                                        <UserX size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivateUser(user.id, user.name)}
                                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-emerald-500 transition-colors"
                                                        title="Activate Account"
                                                    >
                                                        <Shield size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    disabled={user.id === currentUser?.id}
                                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                                                page === pageNum
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Audit Rule */}
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                    <p className="text-sm text-blue-400/80 leading-relaxed italic">
                        <strong>Security Governance:</strong> As a System Admin, you can access global user records for audit purposes. All administrative actions are logged and traceable. You cannot modify your own status or be the last system administrator.
                    </p>
                </div>
            </div>

            {/* Modals */}
            {selectedUserId && currentUser && (
                <UserDetailModal
                    isOpen={!!selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    userId={selectedUserId}
                    onUpdate={loadUsers}
                    currentAdminId={currentUser.id}
                />
            )}

            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={handleFilterApply}
                initialFilters={filters}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.action}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={confirmModal.isDangerous}
                loading={actionLoading}
            />
        </AdminLayout>
    );
}
