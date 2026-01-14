'use client';

import {
    LayoutDashboard,
    Globe,
    Users,
    ShieldCheck,
    History,
    BarChart3,
    Settings,
    Lock,
    Database,
    Mail,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { aside } from 'framer-motion/client';

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Globe, label: 'Workspaces', href: '/admin/workspaces' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: ShieldCheck, label: 'Roles & Permissions', href: '/admin/roles' },
    { icon: History, label: 'Activity & Audit Logs', href: '/admin/logs' },
    { icon: BarChart3, label: 'Reports & Analytics', href: '/admin/reports' },
    { icon: Settings, label: 'System Settings', href: '/admin/settings' },
    { icon: Lock, label: 'Security', href: '/admin/security' },
    { icon: Database, label: 'Backups & Data', href: '/admin/backups' },
    { icon: Mail, label: 'Email / Notifications', href: '/admin/email' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={`fixed left-0 top-0 bottom-0 bg-[#020617] border-r border-white/5 transition-all duration-300 z-50 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#020617]">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-xl">S</span>
                </div>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 font-bold text-white tracking-tight"
                    >
                        SYSTEM<span className="text-primary">ADMIN</span>
                    </motion.div>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-primary transition-colors'} />
                            {!isCollapsed && (
                                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                            )}
                            {isActive && !isCollapsed && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                                />
                            )}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-surface border border-white/10 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-12 border-t border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
        </aside>
    );
}
