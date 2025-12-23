'use client';

import { motion } from 'framer-motion';
import { Search, Plus, Settings, Menu, X, Home, FolderKanban, CheckSquare, Calendar, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            if (userData.organizations && userData.organizations.length > 0) {
                setWorkspace(userData.organizations[0]);
            }
        }
    }, []);

    const navItems = [
        { icon: Home, label: 'Overview', href: '/dashboard', active: true },
        { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects', active: false },
        { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks', active: false },
        { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar', active: false },
        { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', active: false },
    ];

    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'W';
    };

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-white/5 bg-surface/40 backdrop-blur-xl flex items-center px-4 md:px-6 relative z-30">
                <div className="flex items-center gap-4 flex-1">
                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-text-primary hover:text-white transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Workspace name */}
                    <div className="flex items-center gap-3">
                        <div
                            className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10"
                            style={{
                                background: `linear-gradient(135deg, ${workspace?.color || '#4F46E5'}, ${workspace?.color ? workspace.color + 'CC' : '#3B82F6'})`,
                                boxShadow: `0 4px 12px ${workspace?.color ? workspace.color + '40' : 'rgba(79, 70, 229, 0.4)'}`
                            }}
                        >
                            {getInitials(workspace?.name)}
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-sm font-semibold text-white truncate max-w-[150px]">
                                {workspace?.name || 'Loading...'}
                            </h1>
                            <p className="text-[10px] uppercase tracking-wider text-text-secondary font-medium">Workspace</p>
                        </div>
                    </div>
                </div>

                {/* Global Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-6">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="search"
                            placeholder="Search projects, tasks..."
                            className="w-full pl-10 pr-4 py-2 bg-background/60 border border-white/5 rounded-lg text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30">
                        <Plus size={16} />
                        <span>New</span>
                    </button>

                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <Settings size={18} className="text-text-secondary hover:text-white transition-colors" />
                    </button>

                    {/* Profile Avatar */}
                    <button className="w-8 h-8 rounded-full bg-surface-lighter border border-white/10 flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-opacity overflow-hidden">
                        {user?.firstName?.charAt(0) || 'U'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Desktop */}
                <aside className={`hidden md:flex flex-col w-64 border-r border-white/5 bg-surface/20 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${item.active
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-white/5">
                        <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                            <p className="text-xs font-semibold text-white mb-1">Invite Team</p>
                            <p className="text-xs text-text-secondary mb-3">Work better together</p>
                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-all border border-white/5">
                                Add Members
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar */}
                {mobileMenuOpen && (
                    <>
                        <div
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="md:hidden fixed left-0 top-16 bottom-0 w-72 bg-surface border-r border-white/10 z-50 flex flex-col"
                        >
                            <nav className="flex-1 p-4 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${item.active
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-text-secondary hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <item.icon size={18} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-[#020617]/50">
                    {children}
                </main>
            </div>
        </div>
    );
}
