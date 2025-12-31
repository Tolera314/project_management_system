'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Link as LinkIcon, Target, LayoutGrid, CheckCircle2, Loader2, Plus } from 'lucide-react';

interface DependencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    type: 'PROJECT' | 'LIST' | 'TASK';
    organizationId?: string;
    projectId?: string;
    onSuccess: () => void;
}

export default function DependencyModal({ isOpen, onClose, targetId, type, organizationId, projectId, onSuccess }: DependencyModalProps) {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSearchItems();
        }
    }, [isOpen, search]);

    const fetchSearchItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = '';

            if (type === 'PROJECT') {
                url = `http://localhost:4000/projects?organizationId=${organizationId}`;
            } else if (type === 'LIST') {
                url = `http://localhost:4000/projects/${projectId}`; // Will get lists from project
            } else {
                url = `http://localhost:4000/projects/${projectId}`; // Will get tasks from project
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            let filteredItems = [];
            if (type === 'PROJECT') {
                filteredItems = (data.projects || []).filter((p: any) => p.id !== targetId);
            } else if (type === 'LIST') {
                filteredItems = (data.project?.lists || []).filter((l: any) => l.id !== targetId);
            } else {
                filteredItems = (data.project?.lists || []).flatMap((l: any) => l.tasks).filter((t: any) => t.id !== targetId);
            }

            if (search) {
                filteredItems = filteredItems.filter((item: any) =>
                    (item.name || item.title).toLowerCase().includes(search.toLowerCase())
                );
            }

            setItems(filteredItems);
        } catch (error) {
            console.error('Search items error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDependency = async (sourceId: string) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/dependencies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sourceId,
                    targetId,
                    type
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Create dependency error:', error);
        } finally {
            setSubmitting(false);
        }
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
                    className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <LinkIcon size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Add Dependency</h2>
                                <p className="text-xs text-text-secondary">Select a {type.toLowerCase()} that must finish before this one</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-secondary transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 bg-white/[0.02] border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                            <input
                                autoFocus
                                className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder={`Search ${type.toLowerCase()}s...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-auto custom-scrollbar p-4 space-y-2">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-secondary">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <span className="text-sm">Searching...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-20 text-center text-text-secondary">
                                <Search size={40} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No {type.toLowerCase()}s found matching "{search}"</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <button
                                    key={item.id}
                                    disabled={submitting}
                                    onClick={() => handleCreateDependency(item.id)}
                                    className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all group text-left disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                                            {type === 'PROJECT' ? <Target size={16} /> :
                                                type === 'LIST' ? <LayoutGrid size={16} /> :
                                                    <CheckCircle2 size={16} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white leading-none mb-1">
                                                {item.name || item.title}
                                            </div>
                                            <div className="text-[10px] text-text-secondary truncate max-w-[200px]">
                                                {item.description || `ID: ${item.id}`}
                                            </div>
                                        </div>
                                    </div>
                                    <Plus size={16} className="text-text-secondary group-hover:text-primary transition-opacity" />
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center text-[10px] text-text-secondary uppercase tracking-widest font-bold">
                        Only showing {type.toLowerCase()}s within your current {type === 'PROJECT' ? 'organization' : 'project'}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
