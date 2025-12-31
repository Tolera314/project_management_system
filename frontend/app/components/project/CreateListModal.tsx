'use client';

import { useState } from 'react';
import { X, LayoutGrid, Palette, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

export default function CreateListModal({ isOpen, onClose, projectId, onSuccess }: CreateListModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#4F46E5');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    description,
                    color,
                    projectId,
                    position: 9999 // Add to end
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setName('');
                setDescription('');
            }
        } catch (error) {
            console.error('Create list error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/60 z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <LayoutGrid size={20} className="text-primary" />
                                Create New List
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">List Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Backlog, In Progress..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-secondary focus:outline-none focus:border-primary/50 transition-colors"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's this list for?"
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-secondary focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Color</label>
                                <div className="flex gap-2">
                                    {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Creating...' : 'Create List'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
