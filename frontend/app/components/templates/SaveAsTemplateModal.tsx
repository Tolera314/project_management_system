'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, FolderKanban } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const templateSchema = z.object({
    name: z.string().min(1, 'Template name is required').max(100, 'Name is too long'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    visibility: z.enum(['WORKSPACE', 'PRIVATE']),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface SaveAsTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    onSuccess: () => void;
}

const categories = [
    'Software Development',
    'Marketing',
    'Operations',
    'Design',
    'Sales',
    'HR',
    'Finance',
    'Customer Support',
    'Product',
    'Other'
];

export default function SaveAsTemplateModal({
    isOpen,
    onClose,
    projectId,
    projectName,
    onSuccess
}: SaveAsTemplateModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TemplateFormData>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
            name: `${projectName} Template`,
            visibility: 'WORKSPACE',
            category: 'Software Development',
        },
    });

    const onSubmit = async (data: TemplateFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const res = await fetch(`http://localhost:4000/projects/${projectId}/convert-to-template`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create template');
            }

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error('Failed to save as template', err);
            setError(err.message || 'Failed to create template. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            setError(null);
            onClose();
        }
    };

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
                            className="bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                        <Layout className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Save as Template</h2>
                                        <p className="text-xs text-text-secondary">Create a reusable project blueprint</p>
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
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                        <p className="text-sm text-red-400">{error}</p>
                                    </div>
                                )}

                                {/* Template Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        Template Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        {...register('name')}
                                        placeholder="e.g., Software Development Template"
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
                                        placeholder="Describe what this template is for and when to use it..."
                                        rows={3}
                                        className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        Category <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        {...register('category')}
                                        className={`w-full bg-background/60 border ${errors.category ? 'border-danger' : 'border-white/10'
                                            } rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <p className="text-xs text-danger">{errors.category.message}</p>
                                    )}
                                </div>

                                {/* Visibility */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                                        Visibility <span className="text-danger">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 p-4 bg-background/30 border border-white/10 rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                                            <input
                                                {...register('visibility')}
                                                type="radio"
                                                value="WORKSPACE"
                                                className="mt-0.5 w-4 h-4 text-primary focus:ring-primary/30"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-white text-sm">Workspace</div>
                                                <div className="text-xs text-text-secondary mt-1">
                                                    All members in your workspace can view and use this template
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-4 bg-background/30 border border-white/10 rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                                            <input
                                                {...register('visibility')}
                                                type="radio"
                                                value="PRIVATE"
                                                className="mt-0.5 w-4 h-4 text-primary focus:ring-primary/30"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-white text-sm">Private</div>
                                                <div className="text-xs text-text-secondary mt-1">
                                                    Only you can view and use this template
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <p className="text-xs text-blue-400">
                                        💡 <strong>Note:</strong> The template will include your project structure (lists, tasks, milestones)
                                        but will exclude comments, files, activity logs, and time entries.
                                    </p>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between bg-background/50">
                                <button
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FolderKanban size={16} />
                                            <span>Create Template</span>
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
