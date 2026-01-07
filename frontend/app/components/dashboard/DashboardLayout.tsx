'use client';

import { motion } from 'framer-motion';
import { Search, Plus, Settings, Menu, X, Home, FolderKanban, CheckSquare, Calendar, BarChart3, Layout } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InviteToWorkspaceModal from '../workspace/InviteToWorkspaceModal';
import NotificationCenter from '../shared/NotificationCenter';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import WorkspaceCreationModal from './WorkspaceCreationModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchWorkspace = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const selectedId = localStorage.getItem('selectedWorkspaceId');
                const url = selectedId
                    ? `http://localhost:4000/workspaces/me?workspaceId=${selectedId}`
                    : 'http://localhost:4000/workspaces/me';

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.workspace) {
                    setWorkspace(data.workspace);
                    if (!selectedId) {
                        localStorage.setItem('selectedWorkspaceId', data.workspace.id);
                    }
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

    // Check if user can manage templates (Admin or has manage_templates permission)
    const canManageTemplates = user?.systemRole === 'SYSTEM_ADMIN' ||
        workspace?.members?.some((m: any) =>
            m.userId === user?.id && ['Admin', 'Project Manager'].includes(m.role?.name)
        );

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
        <div className="h-screen flex flex-col bg-[#020617] text-foreground overflow-hidden">
            {/* Global Header */}
            <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <WorkspaceSwitcher
                        currentWorkspace={workspace}
                        isCollapsed={!sidebarOpen || isMobile}
                        onOpenModal={() => setIsCreateModalOpen(true)}
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:flex items-center gap-1 bg-slate-800/50 border border-white/5 rounded-full px-3 py-1.5 mr-4 focus-within:border-indigo-500/50 transition-colors">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search everything..."
                            className="bg-transparent border-none text-xs text-white placeholder:text-slate-600 focus:outline-none w-48"
                        />
                    </div>

                    <NotificationCenter />

                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-slate-800 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-indigo-500/20 transition-all">
                        {user?.firstName?.[0] || 'U'}
                    </div>
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

                        {/* Templates Link (Admin/PM only) */}
                        {canManageTemplates && (
                            <Link
                                href="/templates"
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === '/templates'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Layout size={18} />
                                <span className="text-sm font-medium">Templates</span>
                            </Link>
                        )}
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
                        roles={workspace?.roles || []}
                    />
                    <WorkspaceCreationModal
                        isOpen={isCreateModalOpen}
                        onSuccess={() => window.location.reload()}
                    />
                </main>
            </div >
        </div >
    );
}
