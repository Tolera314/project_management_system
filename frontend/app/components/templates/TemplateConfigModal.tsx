'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Calendar as CalendarIcon, User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const configSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    ownerId: z.string().min(1, 'Project owner is required'),
    timelineBehavior: z.enum(['RELATIVE', 'FIXED']),
    teamMembers: z.array(z.string()).optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface TemplateConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    templateName: string;
    onSubmit: (config: ConfigFormData & { templateId: string }) => void;
}

export default function TemplateConfigModal({
    isOpen,
    onClose,
    templateId,
    templateName,
    onSubmit
}: TemplateConfigModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ConfigFormData>({
        resolver: zodResolver(configSchema),
        defaultValues: {
            name: `${templateName} Project`,
            timelineBehavior: 'RELATIVE',
            teamMembers: [],
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchOrgMembers();
        }
    }, [isOpen]);

    const fetchOrgMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) return;

            const user = JSON.parse(userStr);
            const orgId = user.organizations?.[0]?.id;

            if (!orgId) return;

            const res = await fetch(`http://localhost:4000/workspaces/${orgId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setProjectMembers(data.members || []);

                // Set current user as default owner
                const currentMember = data.members?.find((m: any) => m.userId === user.id);
                if (currentMember) {
                    setValue('ownerId', currentMember.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const handleFormSubmit = async (data: ConfigFormData) => {
        setIsSubmitting(true);
        try {
            await onSubmit({ ...data, templateId });
            handleClose();
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            onClose();
        }
    };

    const timelineBehavior = watch('timelineBehavior');

    if (!isOpen) return null;

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
                            className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <FolderPlus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-text-primary">Configure Project</h2>
                                        <p className="text-xs text-text-secondary">From template: {templateName}</p>
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

                            {/* Form */}
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                {/* Project Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        Project Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        {...register('name')}
                                        placeholder="e.g., Q1 Marketing Campaign"
                                        autoFocus
                                        className={`w-full bg-surface-secondary border ${errors.name ? 'border-danger' : 'border-border'
                                            } rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
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
                                        rows={3}
                                        className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                                    />
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        <CalendarIcon size={14} />
                                        Start Date <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        {...register('startDate')}
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`w-full bg-surface-secondary border ${errors.startDate ? 'border-danger' : 'border-border'
                                            } rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
                                    />
                                    {errors.startDate && (
                                        <p className="text-xs text-danger">{errors.startDate.message}</p>
                                    )}
                                </div>

                                {/* Project Owner */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        <User size={14} />
                                        Project Owner <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        {...register('ownerId')}
                                        className={`w-full bg-surface-secondary border ${errors.ownerId ? 'border-danger' : 'border-border'
                                            } rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
                                    >
                                        <option value="">Select owner...</option>
                                        {projectMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.user.firstName} {member.user.lastName} ({member.role.name})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ownerId && (
                                        <p className="text-xs text-danger">{errors.ownerId.message}</p>
                                    )}
                                </div>

                                {/* Timeline Behavior */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        <Clock size={14} />
                                        Timeline Behavior <span className="text-danger">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 p-4 bg-surface-secondary border border-border rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                                            <input
                                                {...register('timelineBehavior')}
                                                type="radio"
                                                value="RELATIVE"
                                                className="mt-0.5 w-4 h-4 text-primary focus:ring-primary/30"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-text-primary text-sm">Relative Dates (Recommended)</div>
                                                <div className="text-xs text-text-secondary mt-1">
                                                    Task dates will be adjusted relative to the new start date
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-4 bg-surface-secondary border border-border rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                                            <input
                                                {...register('timelineBehavior')}
                                                type="radio"
                                                value="FIXED"
                                                className="mt-0.5 w-4 h-4 text-primary focus:ring-primary/30"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-text-primary text-sm">Fixed Dates (Advanced)</div>
                                                <div className="text-xs text-text-secondary mt-1">
                                                    Keep original template dates unchanged
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <p className="text-xs text-blue-400">
                                        💡 <strong>Tip:</strong> The project structure (lists, tasks, milestones) will be copied from the template.
                                        You can modify everything after creation.
                                    </p>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-surface-secondary">
                                <button
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit(handleFormSubmit)}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FolderPlus size={16} />
                                            <span>Create Project</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
