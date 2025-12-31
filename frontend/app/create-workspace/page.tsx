'use client';

import { motion } from 'framer-motion';
import { Users, Building2, User, Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const workspaceSchema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
    type: z.enum(['personal', 'team', 'company']).optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const workspaceTypes = [
    { value: 'personal', icon: User, label: 'Personal', description: 'For individual use' },
    { value: 'team', icon: Users, label: 'Team', description: 'For small teams' },
    { value: 'company', icon: Building2, label: 'Company', description: 'For organizations' },
] as const;

const workspaceColors = [
    '#4F46E5', '#A78BFA', '#3B82F6', '#10B981',
    '#F59E0B', '#EF4444', '#EC4899', '#06B6D4',
];

export default function CreateWorkspacePage() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<'personal' | 'team' | 'company'>('personal');
    const [selectedColor, setSelectedColor] = useState(workspaceColors[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<WorkspaceFormData>({
        resolver: zodResolver(workspaceSchema),
    });

    const onSubmit = async (data: WorkspaceFormData) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch('http://localhost:4000/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: data.name,
                    type: selectedType,
                    color: selectedColor,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                // If they already have one, just proceed (idempotent behavior)
                if (error.error === 'You already have a workspace') {
                    // This case is now handled by 200 in the updated backend, 
                    // but keeping this for safety if backend isn't rebuilt yet.
                    router.push('/dashboard');
                    return;
                }
                throw new Error(error.error || 'Failed to create workspace');
            }

            const result = await response.json();

            // Update local user data
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.organizations = [{
                    id: result.workspace.id,
                    name: result.workspace.name,
                    role: 'Admin'
                }];
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 600);

        } catch (error: any) {
            console.error('Create workspace error:', error);
            alert(error.message || 'Failed to create workspace');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-6">
            {/* Background */}
            <div className="absolute inset-0 bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#4F46E515,_transparent_50%)]" />
            </div>

            {/* Centered Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                    >
                        Create your workspace
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-text-secondary text-base"
                    >
                        Your workspace holds all projects, tasks, and team members.
                    </motion.p>
                </div>

                {/* Workspace Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-surface/50 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Workspace Name */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-white">
                                Workspace name <span className="text-danger">*</span>
                            </label>
                            <input
                                {...register('name')}
                                placeholder="e.g. Acme Team, Personal, Startup X"
                                autoFocus
                                className={`w-full bg-background/60 border ${errors.name ? 'border-danger' : 'border-white/10'
                                    } rounded-xl px-5 py-4 text-white text-lg placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
                            />
                            {errors.name ? (
                                <p className="text-xs text-danger">{errors.name.message}</p>
                            ) : (
                                <p className="text-xs text-text-secondary/60">You can change this anytime</p>
                            )}
                        </div>

                        {/* Workspace Type */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-white">Workspace type</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {workspaceTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setSelectedType(type.value)}
                                            className={`relative p-5 rounded-xl border-2 transition-all text-left ${selectedType === type.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {selectedType === type.value && (
                                                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <Icon className={`w-6 h-6 mb-3 ${selectedType === type.value ? 'text-primary' : 'text-text-secondary'}`} />
                                            <div className="text-sm font-semibold text-white mb-1">{type.label}</div>
                                            <div className="text-xs text-text-secondary">{type.description}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-white">Visual identity</label>
                            <div className="flex gap-3">
                                {workspaceColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-12 h-12 rounded-xl transition-all ${selectedColor === color
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                                            : 'hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating workspace...
                                    </>
                                ) : (
                                    <>
                                        Create Workspace →
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-text-secondary/60 mt-4">
                                You can invite members later
                            </p>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </div>
    );
}
