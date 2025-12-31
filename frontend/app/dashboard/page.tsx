'use client';

import { motion } from 'framer-motion';
import { FolderPlus, CheckSquare, Calendar, TrendingUp, Clock, Users, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../components/ui/Toast';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import WorkspaceCreationModal from '../components/dashboard/WorkspaceCreationModal';
import ProjectCard from '../components/dashboard/ProjectCard';

interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    color?: string;
    _count: {
        tasks: number;
    };
}

interface DashboardStats {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    teamMembers: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        teamMembers: 1,
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [userName, setUserName] = useState('there');
    const { showToast } = useToast();

    useEffect(() => {
        checkWorkspaceAndLoadData();
    }, []);

    const checkWorkspaceAndLoadData = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            console.log('[Dashboard] Checking workspace. User stranded:', !!userStr);

            if (!token || !userStr) {
                router.push('/login');
                return;
            }

            // Check if user has workspace (Source of Truth check)
            const workspaceResponse = await fetch('http://localhost:4000/workspaces/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (workspaceResponse.ok) {
                const workspaceData = await workspaceResponse.json();
                console.log('[Dashboard] Workspace data:', workspaceData);

                if (!workspaceData.hasWorkspace) {
                    console.warn('[Dashboard] No workspace found, opening creation modal');
                    setIsWorkspaceModalOpen(true);
                    setLoading(false);
                    return;
                }

                // Update local storage with fresh workspace info
                const user = JSON.parse(userStr);
                user.organizations = [workspaceData.workspace];
                localStorage.setItem('user', JSON.stringify(user));

                // Load dashboard data if workspace exists
                loadDashboardData();
            } else {
                console.error('[Dashboard] Workspace check failed status:', workspaceResponse.status);
                router.push('/login');
            }
        } catch (error) {
            console.error('[Dashboard] Failed to check workspace:', error);
            setLoading(false);
        }
    };

    const onWorkspaceCreated = () => {
        setIsWorkspaceModalOpen(false);
        loadDashboardData();
        // Force a reload of the layout to pick up the new workspace
        window.location.reload();
    };

    const loadDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);
            setUserName(user.firstName || 'there');
            const organizationId = user.organizations?.[0]?.id;

            if (!organizationId) {
                setLoading(false);
                return;
            }

            // Fetch projects
            const response = await fetch(`http://localhost:4000/projects?organizationId=${organizationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data.projects || []);

                // Calculate stats
                const totalTasks = data.projects.reduce((sum: number, p: Project) => sum + p._count.tasks, 0);
                setStats({
                    totalProjects: data.projects.length,
                    totalTasks,
                    completedTasks: 0, // Will be calculated when we have task status
                    teamMembers: 1,
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectCreated = (project: any) => {
        showToast('success', 'Project created', `${project.name} is ready to use`);
        loadDashboardData(); // Refresh data
    };

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const hasData = projects.length > 0;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleProjectCreated}
            />

            <WorkspaceCreationModal
                isOpen={isWorkspaceModalOpen}
                onSuccess={onWorkspaceCreated}
            />

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {/* Context-Aware Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 flex items-start justify-between"
                >
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {getTimeGreeting()}, {userName}
                        </h1>
                        {hasData ? (
                            <p className="text-text-secondary text-sm">
                                You're working in <span className="text-white font-medium">{projects[0].name}</span>
                            </p>
                        ) : (
                            <p className="text-text-secondary text-sm">
                                Ready to start your first project
                            </p>
                        )}
                    </div>

                    {hasData && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary/20"
                        >
                            Create Project
                        </button>
                    )}
                </motion.div>

                {hasData ? (
                    <>
                        {/* Overview Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
                        >
                            <div className="p-5 bg-surface/40 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <FolderPlus className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-medium text-text-secondary">Projects</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
                            </div>

                            <div className="p-5 bg-surface/40 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckSquare className="w-4 h-4 text-success" />
                                    <span className="text-xs font-medium text-text-secondary">Active Tasks</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                            </div>

                            <div className="p-5 bg-surface/40 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-4 h-4 text-warning" />
                                    <span className="text-xs font-medium text-text-secondary">This Week</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.completedTasks}</div>
                            </div>

                            <div className="p-5 bg-surface/40 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-4 h-4 text-accent" />
                                    <span className="text-xs font-medium text-text-secondary">Team</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.teamMembers}</div>
                            </div>
                        </motion.div>

                        {/* Recent Projects */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mb-8"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Your Projects</h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-sm text-text-secondary hover:text-white transition-colors"
                                >
                                    View all
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map((project, index) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* Subtle Guidance */}
                        {stats.totalTasks === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                                className="p-4 bg-primary/5 border border-primary/10 rounded-lg"
                            >
                                <p className="text-sm text-text-secondary">
                                    💡 <span className="text-white">Next step:</span> Add tasks to {projects[0].name} to start tracking progress
                                </p>
                            </motion.div>
                        )}
                    </>
                ) : (
                    // Empty State (First Time)
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                            <FolderPlus className="w-10 h-10 text-text-secondary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Create your first project
                        </h2>
                        <p className="text-text-secondary mb-8 max-w-md mx-auto">
                            Projects help you organize work, track progress, and collaborate with your team
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all shadow-lg shadow-primary/20"
                        >
                            Get Started
                        </button>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
}
