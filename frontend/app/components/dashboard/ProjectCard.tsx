'use client';

import { motion } from 'framer-motion';
import { FolderPlus, CheckSquare, Clock, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import ProjectContextMenu from './ProjectContextMenu';
import DependencyModal from '../shared/DependencyModal';
import { useToast } from '../ui/Toast';

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

interface ProjectCardProps {
    project: Project;
    index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
    const { showToast } = useToast();

    const handleAction = (actionId: string) => {
        if (actionId === 'add-dependency') {
            setIsDependencyModalOpen(true);
        }
    };

    return (
        <Link href={`/projects/${project.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="group relative p-5 bg-surface border border-white/10 hover:border-primary/20 rounded-2xl transition-all hover:shadow-2xl hover:shadow-primary/5 cursor-pointer h-full"
            >
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{
                            backgroundColor: `${project.color || '#4F46E5'}15`,
                            border: `1px solid ${project.color || '#4F46E5'}30`
                        }}
                    >
                        <FolderPlus
                            className="w-6 h-6"
                            style={{ color: project.color || '#4F46E5' }}
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className={`p-2 hover:bg-white/5 rounded-xl transition-all \${isMenuOpen ? 'bg-white/10 text-primary' : 'text-text-secondary opacity-0 group-hover:opacity-100'}`}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        <ProjectContextMenu
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            projectName={project.name}
                            onAction={handleAction}
                        />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors truncate">
                    {project.name}
                </h3>

                {project.description ? (
                    <p className="text-sm text-text-secondary mb-4 line-clamp-2 min-h-[40px]">
                        {project.description}
                    </p>
                ) : (
                    <div className="h-[40px] mb-4" />
                )}

                <div className="flex items-center gap-5 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                        <div className="p-1 rounded-md bg-white/5">
                            <CheckSquare className="w-3.5 h-3.5" />
                        </div>
                        <span>{project._count.tasks} tasks</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                        <div className="p-1 rounded-md bg-white/5">
                            <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span>{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                <div
                    className="absolute inset-x-0 bottom-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: project.color || '#4F46E5' }}
                />
            </motion.div>

            <DependencyModal
                isOpen={isDependencyModalOpen}
                onClose={() => setIsDependencyModalOpen(false)}
                targetId={project.id}
                type="PROJECT"
                organizationId={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).organizations[0].id : undefined}
                onSuccess={() => {
                    showToast('success', 'Dependency added', `A project dependency has been linked to ${project.name}`);
                }}
            />
        </Link>
    );
}
