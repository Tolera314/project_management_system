'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, Building2, User, Check, Building } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

interface WorkspaceCreationModalProps {
    isOpen: boolean;
    onSuccess: (workspace: any) => void;
}

export default function WorkspaceCreationModal({ isOpen, onSuccess }: WorkspaceCreationModalProps) {
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
                window.location.href = '/login';
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

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create workspace');
            }

            // Update selected workspace id
            localStorage.setItem('selectedWorkspaceId', result.workspace.id);

            // Update local user data
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                // Just add this to the list of organizations if we were tracking them, 
                // but since we rely on selectedWorkspaceId + refresh, this is safer.
                if (!user.organizations) user.organizations = [];
                user.organizations.push({
                    id: result.workspace.id,
                    name: result.workspace.name,
                    color: result.workspace.color,
                    role: 'Admin'
                });
                localStorage.setItem('user', JSON.stringify(user));
            }

            onSuccess(result.workspace);

        } catch (error: any) {
            console.error('Create workspace error:', error);
            alert(error.message || 'Failed to create workspace');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                >
                    <div className="p-8 md:p-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                <Building className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground leading-tight">Create your workspace</h2>
                                <p className="text-text-secondary text-sm">Every project lives inside a workspace.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Workspace Name</label>
                                <input
                                    {...register('name')}
                                    placeholder="e.g. Acme Studio, Marketing Team"
                                    className={`w-full bg-surface border \${errors.name ? 'border-danger' : 'border-white/10'} rounded-xl px-4 py-3.5 text-foreground placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
                                />
                                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-primary">Workspace Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {workspaceTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setSelectedType(type.value)}
                                            className={`relative p-4 rounded-xl border transition-all text-left flex flex-col items-center justify-center gap-2 ${selectedType === type.value
                                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                                : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <type.icon size={20} className={selectedType === type.value ? 'text-primary' : 'text-text-secondary'} />
                                            <span className="text-xs font-medium text-foreground">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-primary">Visual Identity</label>
                                <div className="flex flex-wrap gap-2">
                                    {workspaceColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-white' : ''}`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {selectedColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Create Workspace →'
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-text-secondary/50 mt-4 leading-relaxed">
                                    By creating a workspace, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
