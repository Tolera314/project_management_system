'use client';

import { Search, Bell, User, LogOut, Shield, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function AdminHeader() {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        loadNotifications();
        // Set up periodic refresh
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await AdminService.getNotifications();
            setNotifications(data || []);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await AdminService.markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark notification read", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search users, workspaces, or audit logs..."
                        className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-foreground/[0.05] rounded-lg transition-all"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-foreground/[0.05] rounded-lg transition-all"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-3 w-80 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-border bg-foreground/[0.02] flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Notifications</h3>
                                    {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-96 overflow-y-auto p-1">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <button
                                                key={n.id}
                                                onClick={() => handleMarkRead(n.id)}
                                                className={`w-full text-left p-3 rounded-xl transition-all hover:bg-foreground/[0.03] group relative flex gap-3 ${!n.isRead ? 'bg-primary/[0.02]' : ''}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full absolute top-4 right-4 ${!n.isRead ? 'bg-primary animate-pulse' : 'hidden'}`} />
                                                <div className={`p-2 rounded-lg shrink-0 ${n.type === 'SECURITY_ALERT' ? 'bg-danger/10 text-danger' :
                                                        n.type === 'BILLING_NOTICE' ? 'bg-warning/10 text-warning' :
                                                            'bg-primary/10 text-primary'
                                                    }`}>
                                                    <Shield size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-text-primary leading-tight truncate pr-4">{n.title}</p>
                                                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[10px] text-text-secondary mt-1 opacity-60">
                                                        {new Date(n.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-text-secondary">
                                            <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">No notifications yet</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 border-t border-border bg-foreground/[0.01]">
                                    <button className="w-full py-2 px-3 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-all text-center">
                                        View System Log Archive
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-[1px] bg-border mx-2" />

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 p-1 rounded-full border border-border hover:border-primary/50 transition-all bg-foreground/[0.03]"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                            MA
                        </div>
                    </button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-3 w-56 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden py-1"
                            >
                                <div className="px-4 py-3 border-b border-border">
                                    <p className="text-sm font-bold text-text-primary">Master Admin</p>
                                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">System Superuser</p>
                                </div>
                                <div className="p-1">
                                    <Link
                                        href="/admin/profile"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-foreground/[0.05] transition-all text-left"
                                    >
                                        <User size={16} />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/admin/profile"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-foreground/[0.05] transition-all text-left"
                                    >
                                        <Shield size={16} />
                                        Security
                                    </Link>
                                    <Link
                                        href="/admin/settings"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-foreground/[0.05] transition-all text-left"
                                    >
                                        <SettingsIcon size={16} />
                                        Platform Settings
                                    </Link>
                                </div>
                                <div className="p-1 border-t border-border">
                                    <button
                                        onClick={() => AuthService.logout()}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-danger hover:text-white hover:bg-danger transition-all"
                                    >
                                        <LogOut size={16} />
                                        Sign out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
