'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/api.config';
import UserAvatar from './UserAvatar';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actor?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
    project?: {
        id: string;
        name: string;
    };
    task?: {
        id: string;
        title: string;
    };
    link?: string;
}

import { socketService } from '../../services/socket.service';

const API_URL = API_BASE_URL;

const NotificationCenter = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for real-time notifications
        socketService.on('notification', (newNotification: Notification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Optional: Play sound or show toast
        });

        // Fallback polling (every 5 mins instead of 1)
        const interval = setInterval(fetchNotifications, 300000);
        return () => {
            clearInterval(interval);
            socketService.off('notification');
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.isRead) {
            await markAsRead(notif.id);
        }

        setIsOpen(false);

        // Logic for redirection
        if (notif.link) {
            // Priority 1: Direct link if provided by backend (already standardized)
            try {
                const url = new URL(notif.link, window.location.origin);
                if (url.origin === window.location.origin) {
                    router.push(url.pathname + url.search);
                } else {
                    window.location.href = notif.link;
                }
            } catch (e) {
                // If not a valid URL, it's a relative path
                router.push(notif.link);
            }
        } else if (notif.task && notif.project) {
            // Priority 2: Standard task navigation
            router.push(`/projects/${notif.project.id}?taskId=${notif.task.id}`);
        } else if (notif.project) {
            // Priority 3: Standard project navigation
            router.push(`/projects/${notif.project.id}`);
        } else if (notif.type === 'INVITATION_ACCEPTED') {
            router.push('/dashboard/projects');
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-white/5"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-[calc(100vw-32px)] md:w-96 bg-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <p className="text-sm text-foreground">All caught up!</p>
                                        <p className="text-xs text-text-secondary mt-1">No new notifications.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {Object.entries(
                                            notifications.reduce((groups, notif) => {
                                                const date = new Date(notif.createdAt);
                                                const dateStr = date.toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric'
                                                });
                                                const todayStr = new Date().toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric'
                                                });
                                                const groupKey = dateStr === todayStr ? 'Today' : dateStr;

                                                if (!groups[groupKey]) groups[groupKey] = [];
                                                groups[groupKey].push(notif);
                                                return groups;
                                            }, {} as Record<string, Notification[]>)
                                        ).map(([group, groupNotifications]) => (
                                            <div key={group} className="bg-surface/50">
                                                <div className="px-4 py-2 bg-white/5 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-y border-white/5">
                                                    {group}
                                                </div>
                                                <div className="divide-y divide-white/5">
                                                    {groupNotifications.map((notif) => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => handleNotificationClick(notif)}
                                                            className={`p-4 hover:bg-white/5 transition-colors relative group cursor-pointer ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className="shrink-0 mt-0.5">
                                                                    <UserAvatar
                                                                        firstName={notif.actor?.firstName}
                                                                        lastName={notif.actor?.lastName}
                                                                        avatarUrl={notif.actor?.avatarUrl}
                                                                        size="sm"
                                                                        className={!notif.isRead ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className={`text-sm leading-tight ${!notif.isRead ? 'text-white font-medium' : 'text-slate-300'}`}>
                                                                            {notif.actor ? (
                                                                                <span className="font-semibold text-white mr-1">
                                                                                    {notif.actor.firstName} {notif.actor.lastName}
                                                                                </span>
                                                                            ) : <span className="text-slate-500 mr-1">System</span>}
                                                                            {notif.message}
                                                                        </div>
                                                                        {!notif.isRead && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                                                className="shrink-0 text-slate-500 hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100"
                                                                                title="Mark as read"
                                                                            >
                                                                                <Check className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                                        </span>
                                                                        {(notif.project || notif.task) && (
                                                                            <>
                                                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                                                <span className="text-primary truncate">
                                                                                    {notif.task ? notif.task.title : notif.project?.name || 'Deleted Project'}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-white/5 bg-white/5 text-center">
                                <Link
                                    href="/settings/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-slate-500 hover:text-white transition-colors"
                                >
                                    Notification Preferences
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
