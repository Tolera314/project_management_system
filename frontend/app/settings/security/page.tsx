'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, Laptop, Smartphone, Globe, LogOut, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { API_BASE_URL } from '../../config/api.config';

export default function SecuritySettingsPage() {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('error', 'Match Error', 'New passwords do not match');
            return;
        }

        setIsPasswordSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (res.ok) {
                showToast('success', 'Security Updated', 'Your password has been changed.');
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const data = await res.json();
                showToast('error', 'Update Failed', data.error || 'Failed to change password');
            }
        } catch (error) {
            showToast('error', 'Error', 'An unexpected error occurred');
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId));
                showToast('success', 'Session Revoked', 'The device has been logged out.');
            }
        } catch (error) {
            showToast('error', 'Error', 'Failed to revoke session');
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm('Are you sure you want to log out of all other devices?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/sessions`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Keep only the current session (the most recent one or re-fetch)
                fetchSessions();
                showToast('success', 'Global Logout', 'All other sessions have been terminated.');
            }
        } catch (error) {
            showToast('error', 'Error', 'Failed to revoke sessions');
        }
    };

    const getDeviceIcon = (userAgent: string) => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) return <Smartphone size={18} />;
        return <Laptop size={18} />;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Security & Access</h2>
                </div>
                <p className="text-sm text-slate-400">Protect your account and manage active login sessions.</p>
            </div>

            {/* Password Change Section */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Key size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Change Password</h3>
                        <p className="text-xs text-slate-500">Regularly updating your password enhances account security.</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="group space-y-2">
                        <label className="text-xs font-semibold text-slate-400 group-focus-within:text-primary transition-colors">Current Password</label>
                        <input
                            type="password"
                            required
                            value={passwordData.oldPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                            placeholder="Enter your current password"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group space-y-2">
                            <label className="text-xs font-semibold text-slate-400 group-focus-within:text-emerald-500 transition-colors">New Password</label>
                            <input
                                type="password"
                                required
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                                placeholder="Min 8 chars"
                            />
                        </div>
                        <div className="group space-y-2">
                            <label className="text-xs font-semibold text-slate-400 group-focus-within:text-emerald-500 transition-colors">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                                placeholder="Repeat new password"
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPasswordSaving}
                            className="w-full md:w-auto px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            {isPasswordSaving && <Loader2 size={16} className="animate-spin" />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <Laptop size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Active Sessions</h3>
                            <p className="text-xs text-slate-500">You're currently logged into ProjectOS on these devices.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRevokeAllSessions}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-all"
                    >
                        <LogOut size={14} />
                        Log out all other sessions
                    </button>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                    {sessions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic text-sm">
                            No active sessions found.
                        </div>
                    ) : (
                        sessions.map((session, idx) => (
                            <div key={session.id} className="p-4 md:p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                        {getDeviceIcon(session.userAgent || '')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white max-w-[200px] truncate">
                                                {session.userAgent || 'Unknown Device'}
                                            </h4>
                                            {idx === 0 && (
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">This device</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Globe size={12} /> {session.ipAddress || '127.0.0.1'}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span>Active {new Date(session.lastActive).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {idx !== 0 && (
                                    <button
                                        onClick={() => handleRevokeSession(session.id)}
                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Terminate session"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
