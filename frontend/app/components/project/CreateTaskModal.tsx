'use client';

import { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    initialStatus?: string;
    lists: any[];
}

export default function CreateTaskModal({ isOpen, onClose, projectId, onSuccess, initialStatus, lists }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState(initialStatus || 'TODO');
    const [listId, setListId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialStatus) setStatus(initialStatus);
        if (lists && lists.length > 0 && !listId) {
            setListId(lists[0].id);
        }
    }, [initialStatus, lists]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !listId) {
            setError('Title and List are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    status,
                    projectId,
                    listId
                })
            });

            if (res.ok) {
                setTitle('');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create task');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface-secondary/30">
                            <div>
                                <h2 className="text-xl font-black text-text-primary tracking-tight">Create New Task</h2>
                                <p className="text-xs text-text-secondary font-medium">Add a new task to your project</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-xl transition-colors">
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm animate-shake">
                                    <AlertCircle size={18} />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Task Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-secondary/30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Initial Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="IN_REVIEW">In Review</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Destination List</label>
                                    <select
                                        value={listId}
                                        onChange={(e) => setListId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        {lists.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 rounded-2xl text-sm font-black text-text-primary bg-surface-secondary hover:bg-surface-secondary/70 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-primary text-white px-6 py-4 rounded-2xl text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            Create Task
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
