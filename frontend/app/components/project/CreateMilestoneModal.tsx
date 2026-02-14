'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, AlignLeft, Users, Plus, Check } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface CreateMilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    projectTasks: any[];
}

export default function CreateMilestoneModal({ isOpen, onClose, projectId, onSuccess, projectTasks }: CreateMilestoneModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/milestones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    description,
                    dueDate,
                    projectId,
                    taskIds: selectedTaskIds
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setName('');
                setDescription('');
                setDueDate('');
                setSelectedTaskIds([]);
            }
        } catch (error) {
            console.error('Create milestone error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Target size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-secondary">Create Milestone</h2>
                                <p className="text-xs text-text-secondary">Define a major project checkpoint</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full text-text-secondary transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Target size={14} /> Milestone Name
                                </label>
                                <input
                                    required
                                    className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="e.g., Alpha Version Release"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={14} /> Due Date
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                        <Users size={14} /> Owner
                                    </label>
                                    <div className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-secondary cursor-not-allowed">
                                        Project Manager
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <AlignLeft size={14} /> Description
                                </label>
                                <textarea
                                    className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                                    placeholder="What does this milestone represent?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> Linked Tasks
                                </label>
                                <div className="max-h-[200px] overflow-auto custom-scrollbar border border-border rounded-xl bg-surface-secondary divide-y divide-border">
                                    {projectTasks.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-text-secondary italic">
                                            No tasks available to link
                                        </div>
                                    ) : (
                                        projectTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => toggleTaskSelection(task.id)}
                                                className="flex items-center justify-between p-3 hover:bg-foreground/5 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedTaskIds.includes(task.id) ? 'bg-primary border-primary' : 'border-text-secondary/20'}`}>
                                                        {selectedTaskIds.includes(task.id) && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <span className="text-xs text-text-primary truncate">{task.title}</span>
                                                </div>
                                                <span className="text-[10px] text-text-secondary uppercase font-bold px-1.5 py-0.5 rounded bg-foreground/5">
                                                    {task.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-surface-secondary text-text-secondary font-bold rounded-xl hover:bg-border transition-all border border-border"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-2 px-12 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Milestone'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
