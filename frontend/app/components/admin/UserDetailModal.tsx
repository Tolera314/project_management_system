'use client';

import { X, User, Shield, Activity, Clock, MapPin, Monitor, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AdminService, UserDetailData, AuditLogData } from '../../services/admin.service';
import ConfirmationModal from './ConfirmationModal';

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onUpdate: () => void;
    currentAdminId: string;
}

type Tab = 'overview' | 'workspaces' | 'security' | 'audit';

export default function UserDetailModal({
    isOpen,
    onClose,
    userId,
    onUpdate,
    currentAdminId
}: UserDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [user, setUser] = useState<UserDetailData | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmation modals
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => void;
        isDangerous?: boolean;
    }>({ isOpen: false, title: '', message: '', action: () => {} });

    useEffect(() => {
        if (isOpen && userId) {
            loadUserData();
        }
    }, [isOpen, userId]);

    useEffect(() => {
        if (activeTab === 'audit' && userId) {
            loadAuditLogs();
        }
    }, [activeTab, userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getUserDetail(userId);
            setUser(data);
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAuditLogs = async () => {
        try {
            const { logs } = await AdminService.getUserAuditHistory(userId);
            setAuditLogs(logs);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        }
    };

    const handleRoleChange = async (newRole: string) => {
        try {
            setActionLoading(true);
            await AdminService.updateUserRole(userId, newRole);
            await loadUserData();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update role');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            setActionLoading(true);
            await AdminService.updateUserStatus(userId, newStatus);
            await loadUserData();
            onUpdate();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceLogout = async () => {
        try {
            setActionLoading(true);
            await AdminService.forceLogoutUser(userId);
            await loadUserData();
            alert('All sessions revoked successfully');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to force logout');
        } finally {
            setActionLoading(false);
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleResetPassword = async () => {
        try {
            setActionLoading(true);
            await AdminService.resetUserPassword(userId);
            alert('Password reset email sent successfully');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setActionLoading(false);
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleToggleMFA = async () => {
        if (!user) return;
        try {
            setActionLoading(true);
            await AdminService.toggleUserMFA(userId, !user.mfaEnabled);
            await loadUserData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to toggle MFA');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveFromWorkspace = async (organizationId: string, orgName: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove from Workspace',
            message: `Remove this user from "${orgName}"? They will lose all project access within this workspace.`,
            action: async () => {
                try {
                    setActionLoading(true);
                    await AdminService.removeUserFromWorkspace(userId, organizationId);
                    await loadUserData();
                    onUpdate();
                } catch (error: any) {
                    alert(error.response?.data?.error || 'Failed to remove user');
                } finally {
                    setActionLoading(false);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            },
            isDangerous: true
        });
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'overview' as Tab, label: 'Overview', icon: User },
        { id: 'workspaces' as Tab, label: 'Workspaces', icon: Shield },
        { id: 'security' as Tab, label: 'Security', icon: Clock },
        { id: 'audit' as Tab, label: 'Audit Trail', icon: Activity }
    ];

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return 'text-emerald-500 bg-emerald-500/10';
            case 'SUSPENDED': return 'text-red-500 bg-red-500/10';
            case 'PENDING': return 'text-amber-500 bg-amber-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SYSTEM_ADMIN': return 'bg-amber-500/10 text-amber-500';
            case 'SUPPORT': return 'bg-blue-500/10 text-blue-500';
            default: return 'bg-white/5 text-slate-400';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="relative bg-[#0F172A] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/10">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white z-10"
                        >
                            <X size={20} />
                        </button>

                        {loading ? (
                            <div className="h-16 flex items-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
                                <div className="ml-4 space-y-2">
                                    <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
                                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                                </div>
                            </div>
                        ) : user ? (
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-white">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getRoleBadgeColor(user.systemRole)}`}>
                                            {user.systemRole.replace('_', ' ')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${getStatusColor(user.status)}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {user.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">{user.email}</p>
                                    <p className="text-slate-500 text-xs mt-1">ID: {user.id}</p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 px-8 pt-6 border-b border-white/10">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'bg-white/5 text-white border-b-2 border-primary'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : user ? (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Quick Actions */}
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    value={user.systemRole}
                                                    onChange={(e) => handleRoleChange(e.target.value)}
                                                    disabled={userId === currentAdminId || actionLoading}
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="SYSTEM_ADMIN">System Admin</option>
                                                    <option value="SUPPORT">Support</option>
                                                    <option value="USER">User</option>
                                                </select>

                                                <select
                                                    value={user.status}
                                                    onChange={(e) => handleStatusChange(e.target.value)}
                                                    disabled={userId === currentAdminId || actionLoading}
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="SUSPENDED">Suspended</option>
                                                    <option value="PENDING">Pending</option>
                                                </select>

                                                <button
                                                    onClick={() => setConfirmModal({
                                                        isOpen: true,
                                                        title: 'Force Logout',
                                                        message: 'Revoke all active sessions for this user? They will need to log in again.',
                                                        action: handleForceLogout,
                                                        isDangerous: false
                                                    })}
                                                    disabled={userId === currentAdminId || actionLoading}
                                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Force Logout
                                                </button>

                                                <button
                                                    onClick={() => setConfirmModal({
                                                        isOpen: true,
                                                        title: 'Reset Password',
                                                        message: 'Send password reset email to this user? A temporary password will be generated.',
                                                        action: handleResetPassword,
                                                        isDangerous: false
                                                    })}
                                                    disabled={actionLoading}
                                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Reset Password
                                                </button>
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Created</p>
                                                        <p className="text-white text-sm">{new Date(user.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Last Login</p>
                                                        <p className="text-white text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Workspaces</p>
                                                        <p className="text-white text-sm">{user.workspaces.length}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">MFA Status</p>
                                                        <p className="text-white text-sm">{user.mfaEnabled ? 'Enabled' : 'Disabled'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

{activeTab === 'workspaces' && (
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4">Workspace Memberships ({user.workspaces.length})</h3>
                                        {user.workspaces.length === 0 ? (
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                                <p className="text-slate-400">Not a member of any workspace</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {user.workspaces.map(ws => (
                                                    <div key={ws.organizationId} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="text-white font-bold mb-1">{ws.organizationName}</p>
                                                                <p className="text-slate-400 text-sm mb-2">Role: {ws.role}</p>
                                                                <p className="text-slate-500 text-xs">Joined: {new Date(ws.joinedAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveFromWorkspace(ws.organizationId, ws.organizationName)}
                                                                disabled={actionLoading}
                                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        {/* MFA Section */}
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4">Multi-Factor Authentication</h3>
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-bold mb-1">MFA Status</p>
                                                        <p className="text-slate-400 text-sm">{user.mfaEnabled ? 'Enabled' : 'Disabled'}</p>
                                                    </div>
                                                    <button
                                                        onClick={handleToggleMFA}
                                                        disabled={actionLoading}
                                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                            user.mfaEnabled
                                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                                                                : 'bg-primary hover:bg-primary/90 text-white'
                                                        }`}
                                                    >
                                                        {user.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Sessions */}
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4">Active Sessions ({user.activeSessions.length})</h3>
                                            {user.activeSessions.length === 0 ? (
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                                    <p className="text-slate-400">No active sessions</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {user.activeSessions.map(session => (
                                                        <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                            <div className="flex items-start gap-4">
                                                                <div className="p-3 bg-white/5 rounded-xl">
                                                                    <Monitor size={20} className="text-primary" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-white font-bold mb-1">{session.userAgent || 'Unknown Device'}</p>
                                                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <MapPin size={12} />
                                                                            {session.ipAddress || 'Unknown IP'}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Clock size={12} />
                                                                            {new Date(session.lastActive).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'audit' && (
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4">Audit Trail</h3>
                                        {auditLogs.length === 0 ? (
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                                <p className="text-slate-400">No audit logs found</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {auditLogs.map(log => (
                                                    <div key={log.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <AlertCircle size={20} className="text-amber-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-white font-bold">{log.action.replace(/_/g, ' ')}</p>
                                                                    <p className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                                                                </div>
                                                                <p className="text-slate-400 text-sm mb-2">
                                                                    By: {log.performedBy.firstName} {log.performedBy.lastName} ({log.performedBy.email})
                                                                </p>
                                                                {log.metadata && (
                                                                    <p className="text-slate-500 text-xs">
                                                                        {JSON.stringify(log.metadata)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </motion.div>

                {/* Confirmation Modal */}
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={confirmModal.action}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    isDangerous={confirmModal.isDangerous}
                    loading={actionLoading}
                />
            </div>
        </AnimatePresence>
    );
}
