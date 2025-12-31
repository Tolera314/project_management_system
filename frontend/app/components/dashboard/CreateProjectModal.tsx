'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Palette, Link as LinkIcon, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const projectColors = [
    { name: 'Primary', value: '#4F46E5' },
    { name: 'Purple', value: '#A78BFA' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
];

const projectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
    description: z.string().optional(),
    color: z.string().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
    dependencyIds: z.array(z.string()),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (project: any) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
    const [selectedColor, setSelectedColor] = useState(projectColors[0].value);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingProjects, setExistingProjects] = useState<any[]>([]);
    const [isDependencySearchOpen, setIsDependencySearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            color: projectColors[0].value,
            priority: 'MEDIUM',
            status: 'NOT_STARTED',
            dependencyIds: [],
        },
    });

    const selectedDependencies = watch('dependencyIds');

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) return;

            const user = JSON.parse(userStr);
            const organizationId = user.organizations?.[0]?.id;
            if (!organizationId) return;

            const response = await fetch(`http://localhost:4000/projects?organizationId=${organizationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setExistingProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const onSubmit = async (data: ProjectFormData) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                alert('Please log in to create a project');
                window.location.href = '/login';
                return;
            }

            const user = JSON.parse(userStr);
            const organizationId = user.organizations?.[0]?.id;

            if (!organizationId) {
                alert('No organization found.');
                return;
            }

            const response = await fetch('http://localhost:4000/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...data,
                    color: selectedColor,
                    organizationId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create project');
            }

            const result = await response.json();
            onSuccess(result.project);
            reset();
            setSelectedColor(projectColors[0].value);
            onClose();

        } catch (error: any) {
            console.error('Create project error:', error);
            alert(error.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            setSelectedColor(projectColors[0].value);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <FolderPlus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Create New Project</h2>
                                        <p className="text-xs text-text-secondary">Organize work into focused projects</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <X size={18} className="text-text-secondary" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                                {/* Project Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">
                                        Project Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        {...register('name')}
                                        placeholder="e.g., Website Redesign"
                                        autoFocus
                                        className={`w-full bg-background/60 border ${errors.name ? 'border-danger' : 'border-white/10'
                                            } rounded-xl px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-danger">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">
                                        Description
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        placeholder="Brief description of this project..."
                                        rows={2}
                                        className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                                    />
                                </div>

                                {/* Status and Priority */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-primary">Status</label>
                                        <select
                                            {...register('status')}
                                            className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                        >
                                            <option value="NOT_STARTED">Not Started</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="ON_HOLD">On Hold</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-primary">Priority</label>
                                        <select
                                            {...register('priority')}
                                            className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-primary">Start Date</label>
                                        <input
                                            type="date"
                                            {...register('startDate')}
                                            className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-primary">Due Date</label>
                                        <input
                                            type="date"
                                            {...register('dueDate')}
                                            className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Dependencies */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                                            <LinkIcon size={16} className="text-amber-500" />
                                            Required Dependencies
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsDependencySearchOpen(!isDependencySearchOpen)}
                                            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                        >
                                            {isDependencySearchOpen ? 'Done' : '+ Add Dependency'}
                                        </button>
                                    </div>

                                    {isDependencySearchOpen && (
                                        <div className="relative animate-in fade-in slide-in-from-top-2">
                                            <input
                                                type="text"
                                                placeholder="Search projects to link..."
                                                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            {searchQuery && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-xl shadow-2xl z-10 max-h-40 overflow-y-auto overflow-x-hidden py-1">
                                                    {existingProjects
                                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedDependencies.includes(p.id))
                                                        .map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setValue('dependencyIds', [...selectedDependencies, p.id]);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-xs text-white hover:bg-white/5 transition-colors flex items-center justify-between group"
                                                            >
                                                                <span className="truncate">{p.name}</span>
                                                                <Plus size={12} className="text-primary opacity-0 group-hover:opacity-100" />
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {selectedDependencies.map(depId => {
                                            const proj = existingProjects.find(p => p.id === depId);
                                            return proj ? (
                                                <div key={depId} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg group animate-in zoom-in-95">
                                                    <LinkIcon size={12} className="text-amber-500" />
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase">{proj.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue('dependencyIds', selectedDependencies.filter(id => id !== depId))}
                                                        className="p-0.5 hover:bg-amber-500/20 rounded text-amber-500"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                        {selectedDependencies.length === 0 && !isDependencySearchOpen && (
                                            <p className="text-[10px] text-text-secondary italic uppercase tracking-widest py-2">No dependencies selected</p>
                                        )}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                                        <Palette size={16} />
                                        Project Color
                                    </label>
                                    <div className="grid grid-cols-8 gap-2">
                                        {projectColors.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setSelectedColor(color.value)}
                                                className={`w-full aspect-square rounded-lg transition-all ${selectedColor === color.value
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                                                    : 'hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 sticky bottom-0 bg-surface py-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <FolderPlus size={18} />
                                                Create Project
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
