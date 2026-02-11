'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Search, Plus, Settings, Menu, X, Home, FolderKanban,
    CheckSquare, Calendar, BarChart3, Layout, User,
    Shield, Palette, LogOut, ChevronDown
} from 'lucide-react';
import InviteToWorkspaceModal from '../workspace/InviteToWorkspaceModal';
import NotificationCenter from '../shared/NotificationCenter';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import WorkspaceCreationModal from './WorkspaceCreationModal';
import { useUser } from '../../context/UserContext';
import UserAvatar from '../shared/UserAvatar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

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
            if (!token || token === 'undefined' || token === 'null') {
                setWorkspaceLoading(false);
                return;
            }

            try {
                const selectedId = localStorage.getItem('selectedWorkspaceId');
                const url = selectedId
                    ? `http://localhost:4000/workspaces/me?workspaceId=${selectedId}`
                    : 'http://localhost:4000/workspaces/me';

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                    return;
                }

                const data = await res.json();
                if (data.workspace) {
                    setWorkspace(data.workspace);
                    if (!selectedId) {
                        localStorage.setItem('selectedWorkspaceId', data.workspace.id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch workspace:', error);
            } finally {
                setWorkspaceLoading(false);
            }
        };

        fetchWorkspace();
    }, []);

    const navItems = [
        { icon: Home, label: 'Dashboard', href: '/dashboard' },
        { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects' },
        { icon: Layout, label: 'Templates', href: '/dashboard/templates' },
        { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks' },
        { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar' },
        { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
    ];

    // Check if user can manage templates (Admin or has manage_templates permission)
    const canManageTemplates = useMemo(() => {
        if (user?.systemRole === 'ADMIN') return true;

        const selectedId = workspace?.id || (typeof window !== 'undefined' ? localStorage.getItem('selectedWorkspaceId') : null);
        const currentOrgRole = user?.organizations?.find(org => org.id === selectedId)?.role;

        const isManager = ['Admin', 'Project Manager', 'OWNER', 'Workspace Manager'].includes(currentOrgRole || '');
        if (isManager) return true;

        // Fallback check against workspace members list if available
        return workspace?.members?.some((m: any) =>
            m.userId === user?.id && ['Admin', 'Project Manager', 'OWNER', 'Workspace Manager'].includes(m.role?.name)
        ) || false;
    }, [user, workspace]);

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

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        try {
            setIsSearching(true);
            setShowSearchResults(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/tasks/search?q=\${encodeURIComponent(query)}&workspaceId=\${workspace?.id}`, {
                headers: { 'Authorization': `Bearer \${token}` }
            });
            const data = await res.json();
            setSearchResults(data.tasks || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // ... navItems and helper functions

    if (!mounted) return null;

    if (workspaceLoading) {
        return (
            <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden animate-in fade-in duration-500">
                <header className="h-16 border-b border-foreground/5 bg-surface flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-40 h-8 bg-surface-secondary/50 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-secondary/50 animate-pulse" />
                    </div>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface-secondary p-4 space-y-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="w-full h-10 bg-surface/30 rounded-xl animate-pulse" />
                        ))}
                    </aside>
                    <main className="flex-1 bg-background p-8">
                        <div className="max-w-7xl mx-auto flex flex-col gap-6">
                            <div className="h-10 w-64 bg-surface/30 rounded-xl animate-pulse" />
                            <div className="h-4 w-96 bg-surface/30 rounded-xl animate-pulse" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-48 bg-surface/30 border border-border rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* Global Header */}
            <header className="h-16 border-b border-foreground/5 bg-surface flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-text-secondary hover:text-text-primary"
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
                    <div className="flex-1 md:flex-none flex items-center justify-end md:justify-start gap-1 bg-transparent md:bg-surface-secondary/50 md:border md:border-border rounded-full px-0 md:px-3 py-1.5 md:mr-4 focus-within:border-primary/50 transition-colors relative group">
                        <button
                            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
                            onClick={() => setShowSearchResults(!showSearchResults)}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <Search className="hidden md:block w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="hidden md:block bg-transparent border-none text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none md:w-48 lg:w-64"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchQuery && setShowSearchResults(true)}
                        />

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showSearchResults && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[-1]"
                                        onClick={() => setShowSearchResults(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full right-0 md:left-0 mt-2 w-[calc(100vw-32px)] md:w-80 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-[60]"
                                    >
                                        <div className="md:hidden p-3 border-b border-border bg-surface-secondary">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search everything..."
                                                className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                value={searchQuery}
                                                onChange={(e) => handleSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="p-3 border-b border-border flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Tasks & Results</span>
                                            {isSearching && <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((task: any) => (
                                                    <button
                                                        key={task.id}
                                                        onClick={() => {
                                                            router.push(`/projects/\${task.id}`);
                                                            setShowSearchResults(false);
                                                            setSearchQuery('');
                                                        }}
                                                        className="w-full p-3 flex items-start gap-3 hover:bg-surface-secondary transition-colors text-left group"
                                                    >
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 \${
                                                            task.priority === 'URGENT' ? 'bg-danger' :
                                                            task.priority === 'HIGH' ? 'bg-warning' :
                                                            task.priority === 'MEDIUM' ? 'bg-primary' : 'bg-text-secondary'
                                                        }`} />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-text-primary group-hover:text-primary transition-colors truncate">
                                                                {task.title}
                                                            </p>
                                                            <p className="text-[10px] text-text-secondary truncate mt-0.5">
                                                                {task.project.name} • {task.status.replace('_', ' ')}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                !isSearching && (
                                                    <div className="p-8 text-center">
                                                        <Search size={24} className="mx-auto text-text-secondary/30 mb-2" />
                                                        <p className="text-xs text-text-secondary">No results found for "{searchQuery}"</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <NotificationCenter />

                    <div className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 p-1 rounded-full border border-border bg-surface-secondary/50 hover:bg-surface-secondary transition-all pl-1 pr-3"
                        >
                            <UserAvatar
                                userId={user?.id}
                                firstName={mounted ? user?.firstName : undefined}
                                lastName={mounted ? user?.lastName : undefined}
                                avatarUrl={mounted ? user?.avatarUrl : undefined}
                                size="md"
                                className="border-2 border-background"
                            />
                            <ChevronDown size={12} className={`text-text-secondary transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {userDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setUserDropdownOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 bg-surface border border-foreground/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-xl"
                                    >
                                        <div className="px-4 py-3 border-b border-foreground/10 mb-1.5 bg-foreground/5">
                                            <p className="text-xs font-semibold text-text-primary truncate">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-[10px] text-text-secondary truncate mt-0.5">{user?.email}</p>
                                        </div>

                                        <Link
                                            href="/settings/profile"
                                            className="flex items-center gap-3 px-4 py-2 text-xs text-text-secondary hover:text-primary hover:bg-foreground/5"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <User size={14} /> My Profile
                                        </Link>
                                        <Link
                                            href="/settings/notifications"
                                            className="flex items-center gap-3 px-4 py-2 text-xs text-text-secondary hover:text-primary hover:bg-foreground/5"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <Settings size={14} /> Notifications
                                        </Link>
                                        <Link
                                            href="/settings/security"
                                            className="flex items-center gap-3 px-4 py-2 text-xs text-text-secondary hover:text-primary hover:bg-foreground/5"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <Shield size={14} /> Security
                                        </Link>

                                        <div className="h-px bg-foreground/10 my-1.5" />

                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('token');
                                                localStorage.removeItem('user');
                                                router.push('/login');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                                        >
                                            <LogOut size={14} /> Sign out
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Desktop */}
                <aside className={`hidden md:flex flex-col w-64 border-r border-border bg-surface-secondary transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-text-secondary hover:text-primary hover:bg-foreground/5'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}


                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-border-secondary">
                        <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                            <p className="text-xs font-semibold text-text-primary mb-1">Invite Team</p>
                            <p className="text-xs text-text-secondary mb-3">Work better together</p>
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="w-full py-2 bg-foreground/5 hover:bg-foreground/10 text-text-primary text-xs font-medium rounded-lg transition-all border border-foreground/5"
                            >
                                Add Members
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay & Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileMenuOpen(false)}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 w-72 bg-surface border-r border-border z-50 md:hidden flex flex-col shadow-2xl"
                            >
                                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                                    <span className="text-lg font-bold text-foreground">Menu</span>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-white/5"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'text-text-secondary hover:text-primary hover:bg-foreground/5'
                                                    }`}
                                            >
                                                <item.icon size={18} />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        );
                                    })}


                                </nav>

                                <div className="p-4 border-t border-border bg-surface-secondary/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <UserAvatar
                                            userId={user?.id}
                                            firstName={mounted ? user?.firstName : undefined}
                                            lastName={mounted ? user?.lastName : undefined}
                                            avatarUrl={mounted ? user?.avatarUrl : undefined}
                                            size="sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                            router.push('/login');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/10"
                                    >
                                        <LogOut size={16} /> Sign out
                                    </button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-background relative">
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
