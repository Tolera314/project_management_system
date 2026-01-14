'use client';

import { motion } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectCard from '../../components/dashboard/ProjectCard';
import CreateProjectModal from '../../components/dashboard/CreateProjectModal';
import { useToast } from '../../components/ui/Toast';

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

export default function ProjectsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                router.push('/login');
                return;
            }

            const user = JSON.parse(userStr);
            const organizationId = user.organizations?.[0]?.id;

            if (!organizationId) {
                setLoading(false);
                return;
            }

            const response = await fetch(`http://localhost:4000/projects?organizationId=${organizationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            showToast('error', 'Error', 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleProjectCreated = (project: any) => {
        showToast('success', 'Project created', `${project.name} is ready to use`);
        fetchProjects();
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleProjectCreated}
            />

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Projects</h1>
                        <p className="text-text-secondary text-sm">
                            Manage and track all your active projects
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Create Project
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full bg-surface/40 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 bg-surface/40 border border-border rounded-xl text-slate-400 hover:text-primary transition-colors">
                            <Filter size={18} />
                        </button>
                        <div className="h-10 w-px bg-border mx-1" />
                        <div className="flex bg-surface/40 border border-border rounded-xl p-1">
                            <button className="p-1.5 bg-primary/20 text-primary rounded-lg">
                                <LayoutGrid size={18} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-surface/40 border border-border rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project, index) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-surface/10 border border-dashed border-border rounded-2xl">
                        <div className="bg-surface-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="text-text-secondary" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No projects found</h3>
                        <p className="text-text-secondary text-sm max-w-xs mx-auto mb-6">
                            {searchQuery ? "No projects match your search criteria." : "You haven't created any projects yet. Start by creating your first one."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-5 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-all"
                            >
                                Create your first project
                            </button>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
