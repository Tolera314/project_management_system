'use client';

import { useState, useEffect } from 'react';
import {
    X,
    MoreHorizontal,
    Calendar,
    Plus,
    ChevronDown,
    ChevronRight,
    Circle,
    CheckCircle2,
    LayoutGrid,
    Trash2,
    Palette,
    Flag,
    Type,
    Link as LinkIcon,
    AlertTriangle,
    Clock,
    User as UserIcon,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DependencyModal from '../shared/DependencyModal';

interface ListDetailPanelProps {
    listId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    projectId: string;
}

export default function ListDetailPanel({ listId, isOpen, onClose, onRefresh, projectId }: ListDetailPanelProps) {
    const [list, setList] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

    useEffect(() => {
        if (listId && isOpen) {
            fetchListDetails();
        }
    }, [listId, isOpen]);

    const fetchListDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/lists/details/${listId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setList(data.list);
            }
        } catch (error) {
            console.error('Fetch list details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateList = async (updates: any) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/lists/${listId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                fetchListDetails();
                onRefresh();
            }
        } catch (error) {
            console.error('Update list error:', error);
        }
    };

    const handleDeleteList = async () => {
        if (!confirm('Are you sure you want to delete this list? All tasks within it will also be deleted.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/lists/${listId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onClose();
                onRefresh();
            }
        } catch (error) {
            console.error('Delete list error:', error);
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
                        onClick={onClose}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-[500px] bg-surface-lighter border-l border-white/10 shadow-2xl z-[70] flex flex-col overflow-hidden"
                    >
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : list ? (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                            <X size={20} className="text-text-secondary" />
                                        </button>
                                        <div className="h-4 w-px bg-white/10" />
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                            <LayoutGrid size={12} className="text-primary" />
                                            List Details
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDeleteList}
                                            className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors group"
                                        >
                                            <Trash2 size={18} className="text-text-secondary group-hover:text-rose-500" />
                                        </button>
                                        <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                            <MoreHorizontal size={18} className="text-text-secondary" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                                    {/* Name Field */}
                                    <div className="space-y-4">
                                        {isEditingName ? (
                                            <input
                                                autoFocus
                                                value={list.name}
                                                onChange={(e) => setList({ ...list, name: e.target.value })}
                                                onBlur={() => {
                                                    setIsEditingName(false);
                                                    handleUpdateList({ name: list.name });
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setIsEditingName(false);
                                                        handleUpdateList({ name: list.name });
                                                    }
                                                }}
                                                className="text-4xl font-bold bg-transparent border-none focus:outline-none w-full text-white placeholder:text-white/20"
                                                placeholder="List name..."
                                            />
                                        ) : (
                                            <h1
                                                onClick={() => setIsEditingName(true)}
                                                className="text-4xl font-bold text-white cursor-pointer hover:text-primary transition-colors leading-tight"
                                            >
                                                {list.name}
                                            </h1>
                                        )}
                                    </div>

                                    {/* Meta Grid */}
                                    <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                                <Flag size={12} /> Priority
                                            </label>
                                            <select
                                                value={list.priority || 'MEDIUM'}
                                                onChange={(e) => handleUpdateList({ priority: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="URGENT">Urgent</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                                <Clock size={12} /> Status
                                            </label>
                                            <select
                                                value={list.status || 'ACTIVE'}
                                                onChange={(e) => handleUpdateList({ status: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="ARCHIVED">Archived</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                                <Palette size={12} /> Color
                                            </label>
                                            <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                                                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => handleUpdateList({ color: c })}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${list.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                            <Type size={12} /> Description
                                        </label>
                                        {isEditingDescription ? (
                                            <textarea
                                                autoFocus
                                                value={list.description || ''}
                                                onChange={(e) => setList({ ...list, description: e.target.value })}
                                                onBlur={() => {
                                                    setIsEditingDescription(false);
                                                    handleUpdateList({ description: list.description });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px] resize-none"
                                                placeholder="Add a description for this list..."
                                            />
                                        ) : (
                                            <div
                                                onClick={() => setIsEditingDescription(true)}
                                                className="text-sm text-text-secondary leading-relaxed p-4 bg-white/[0.01] rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors min-h-[100px] cursor-pointer"
                                            >
                                                {list.description || 'No description provided. Click to add one...'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Dependencies Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                                <LinkIcon size={12} /> Dependencies
                                            </label>
                                            <button
                                                onClick={() => setIsDependencyModalOpen(true)}
                                                className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add Dependency
                                            </button>
                                        </div>

                                        <div className="grid gap-2">
                                            {list.dependencies?.map((dep: any) => (
                                                <div key={dep.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                            <LayoutGrid size={14} className="text-amber-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-white uppercase">{dep.source.name}</div>
                                                            <div className="text-[10px] text-text-secondary">Finish to Start</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!list.dependencies || list.dependencies.length === 0) && (
                                                <div className="text-center py-6 bg-white/[0.01] rounded-xl border border-dashed border-white/10 text-[10px] text-text-secondary italic uppercase tracking-widest">
                                                    No dependencies linked
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="p-4 border-t border-white/5 flex items-center gap-6 bg-white/[0.02]">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
                                    >
                                        Tasks
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('activity')}
                                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
                                    >
                                        Activity
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="p-6 h-[300px] overflow-y-auto custom-scrollbar border-t border-white/5 bg-background/50">
                                    {activeTab === 'details' ? (
                                        <div className="space-y-2">
                                            {list.tasks?.map((t: any) => (
                                                <div key={t.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        {t.status === 'DONE' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-text-secondary" />}
                                                        <span className={`text-xs ${t.status === 'DONE' ? 'line-through text-text-secondary' : 'text-white'}`}>{t.title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {list.activityLogs?.map((log: any) => (
                                                <div key={log.id} className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary shrink-0 mt-0.5">
                                                        {log.user.firstName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-white">
                                                            <span className="font-bold">{log.user.firstName}</span> {log.description}
                                                        </div>
                                                        <div className="text-[10px] text-text-secondary mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!list.activityLogs || list.activityLogs.length === 0) && (
                                                <div className="text-center py-10 text-[10px] text-text-secondary italic uppercase tracking-widest">
                                                    No activity logged yet
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </motion.div>

                    <DependencyModal
                        isOpen={isDependencyModalOpen}
                        onClose={() => setIsDependencyModalOpen(false)}
                        targetId={listId || ''}
                        type="LIST"
                        projectId={projectId}
                        onSuccess={fetchListDetails}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
