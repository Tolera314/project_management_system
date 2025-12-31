'use client';

import { motion } from 'framer-motion';
import { Search, Plus, Settings, Menu, X, Home, FolderKanban, CheckSquare, Calendar, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import InviteToWorkspaceModal from '../workspace/InviteToWorkspaceModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    useEffect(() => {
        const fetchWorkspace = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch('http://localhost:4000/workspaces/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.workspace) {
                    setWorkspace(data.workspace);
                }
            } catch (error) {
                console.error('Failed to fetch workspace:', error);
            }
        };

        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }

        fetchWorkspace();
    }, []);

    const navItems = [
        { icon: Home, label: 'Overview', href: '/dashboard', active: true },
        { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects', active: false },
        { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks', active: false },
        { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar', active: false },
        { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', active: false },
    ];

    const handleInviteToWorkspace = async (email: string, roleId: string) => {
        if (!workspace) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/workspaces/${workspace.id}/invitations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, roleId })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to invite to workspace');
        }
    };

    // ... navItems and helper functions

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* ... Header ... */}
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
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-all border border-white/5"
                            >
                                Add Members
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar */}
                {/* ... */}

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-[#020617]/50 relative">
                    {children}
                    <InviteToWorkspaceModal
                        isOpen={isInviteModalOpen}
                        onClose={() => setIsInviteModalOpen(false)}
                        workspaceId={workspace?.id || ''}
                        onInvite={handleInviteToWorkspace}
                        roles={workspace?.roles || []} // Need to ensure roles are fetched with workspace
                    />
                </main>
            </div >
        </div >
    );
}
