'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Palette, Link as LinkIcon, Plus } from 'lucide-react';
import { TemplateService } from '../../services/template.service';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../ui/Toast';

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
    templateId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (project: any) => void;
    initialTemplateId?: string;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess, initialTemplateId }: CreateProjectModalProps) {
    const [selectedColor, setSelectedColor] = useState(projectColors[0].value);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingProjects, setExistingProjects] = useState<any[]>([]);
    const [isDependencySearchOpen, setIsDependencySearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();

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
            templateId: undefined,
        },
    });

    const selectedDependencies = watch('dependencyIds');
    const [mode, setMode] = useState<'BLANK' | 'TEMPLATE'>('BLANK');
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isTemplateConfirmed, setIsTemplateConfirmed] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchTemplates();

            if (initialTemplateId) {
                setMode('TEMPLATE');
                // We'll handle the selection after templates are fetched to ensure we get the color
            }
        }
    }, [isOpen, initialTemplateId]);

    // Handle initial template selection once templates are loaded
    useEffect(() => {
        if (isOpen && initialTemplateId && templates.length > 0) {
            const template = templates.find(t => t.id === initialTemplateId);
            if (template) {
                handleTemplateSelect(template.id, template.color);
            }
        }
    }, [templates, initialTemplateId, isOpen]);

    const fetchTemplates = async () => {
        try {
            const organizationId = localStorage.getItem('selectedWorkspaceId');
            if (!organizationId) return;

            const data = await TemplateService.getTemplates({ organizationId });
            setTemplates(data || []);
        } catch (e) {
            console.error('Fetch templates error', e);
        }
    };

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
                showToast('error', 'Authentication Error', 'Please log in to create a project');
                window.location.href = '/login';
                return;
            }

            const user = JSON.parse(userStr);
            const organizationId = user.organizations?.[0]?.id;

            if (!organizationId) {
                showToast('error', 'Organization Error', 'No organization found.');
                return;
            }

            const requestBody: any = {
                ...data,
                color: selectedColor,
                organizationId,
            };

            // Only include templateId if in template mode and one is selected
            if (mode === 'TEMPLATE' && selectedTemplateId) {
                requestBody.templateId = selectedTemplateId;
            }

            const response = await fetch('http://localhost:4000/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
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
            showToast('error', 'Creation Failed', error.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTemplateSelect = (tId: string, tColor?: string) => {
        setSelectedTemplateId(tId);
        setValue('templateId', tId);
        if (tColor) setSelectedColor(tColor);
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            setSelectedColor(projectColors[0].value);
            setMode('BLANK');
            setSelectedTemplateId(null);
            setIsTemplateConfirmed(false);
            setValue('templateId', undefined);
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
                        className="fixed inset-0 bg-black/60 z-50 transition-opacity"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md overflow-hidden pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <FolderPlus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Create New Project</h2>
                                        <p className="text-xs text-text-secondary">Organize work into focused projects</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="p-2 hover:bg-foreground/5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <X size={18} className="text-text-secondary" />
                                </button>
                            </div>

                            {/* Mode Tabs */}
                            <div className="flex px-6 border-b border-border">
                                <button
                                    onClick={() => setMode('BLANK')}
                                    className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${mode === 'BLANK' ? 'border-primary text-foreground' : 'border-transparent text-text-secondary hover:text-foreground'}`}
                                    type="button"
                                >
                                    Blank Project
                                </button>
                                <button
                                    onClick={() => setMode('TEMPLATE')}
                                    className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${mode === 'TEMPLATE' ? 'border-primary text-foreground' : 'border-transparent text-text-secondary hover:text-foreground'}`}
                                    type="button"
                                >
                                    From Template
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">

                                {/* Template Selection Step */}
                                {mode === 'TEMPLATE' && !isTemplateConfirmed && (
                                    <div className="space-y-5">
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-text-primary">
                                                Select Template <span className="text-danger">*</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                                                {templates.map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => handleTemplateSelect(t.id, t.color)}
                                                        className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${selectedTemplateId === t.id
                                                            ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-2 ring-primary/20'
                                                            : 'bg-background border-border hover:border-text-secondary/20 hover:bg-surface-secondary'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="font-bold text-foreground text-sm">{t.name}</div>
                                                            {selectedTemplateId === t.id && (
                                                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs text-text-secondary line-clamp-2 mb-2">
                                                            {t.description || 'No description'}
                                                        </div>
                                                    </div>
                                                ))}
                                                {templates.length === 0 && (
                                                    <div className="col-span-full text-center py-8 text-text-secondary text-xs italic border border-border border-dashed rounded-xl">
                                                        No templates found for this organization.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-border">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="flex-1 px-4 py-3 bg-surface-secondary hover:bg-border border border-border text-foreground rounded-xl font-medium transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!selectedTemplateId}
                                                onClick={() => setIsTemplateConfirmed(true)}
                                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                Use Template
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Project Confirmation Step */}
                                {(mode === 'BLANK' || (mode === 'TEMPLATE' && isTemplateConfirmed)) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-5"
                                    >
                                        {mode === 'TEMPLATE' && selectedTemplateId && (
                                            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                    <span className="text-xs font-bold text-primary uppercase">
                                                        Using: {templates.find(t => t.id === selectedTemplateId)?.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTemplateConfirmed(false)}
                                                    className="text-[10px] font-bold text-text-secondary hover:text-primary uppercase tracking-wider"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        )}

                                        {/* Project Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-primary">
                                                Project Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                {...register('name')}
                                                placeholder="e.g., Website Redesign"
                                                autoFocus
                                                className={`w-full bg-surface border ${errors.name ? 'border-danger' : 'border-border'
                                                    } rounded-xl px-4 py-3 text-foreground placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
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
                                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                                            />
                                        </div>

                                        {/* Status and Priority */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-primary">Status</label>
                                                <select
                                                    {...register('status')}
                                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
                                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
                                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-primary">Due Date</label>
                                                <input
                                                    type="date"
                                                    {...register('dueDate')}
                                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
                                                        className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                    {searchQuery && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-2xl z-10 max-h-40 overflow-y-auto overflow-x-hidden py-1">
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
                                                                        className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-between group"
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
                                                onClick={() => mode === 'TEMPLATE' ? setIsTemplateConfirmed(false) : handleClose()}
                                                disabled={isSubmitting}
                                                className="flex-1 px-4 py-3 bg-surface-secondary hover:bg-border border border-border text-foreground rounded-xl font-medium transition-all disabled:opacity-50"
                                            >
                                                {mode === 'TEMPLATE' ? 'Back' : 'Cancel'}
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
                                    </motion.div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
