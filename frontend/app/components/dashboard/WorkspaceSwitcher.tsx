'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Plus,
    Settings,
    Check,
    Building,
    ChevronRight,
    Search,
    User,
    Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Workspace {
    id: string;
    name: string;
    role: string;
    color?: string;
}

interface WorkspaceSwitcherProps {
    currentWorkspace: Workspace | null;
    isCollapsed?: boolean;
    onOpenModal: () => void;
}

const WorkspaceSwitcher = ({ currentWorkspace, isCollapsed = false, onOpenModal }: WorkspaceSwitcherProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchWorkspaces();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchWorkspaces = async () => {
        const token = localStorage.getItem('token');
        if (!token || token === 'undefined' || token === 'null') return;

        try {
            const res = await fetch('http://localhost:4000/workspaces/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (data.workspaces) {
                setWorkspaces(data.workspaces);
            }
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
        }
    };

    const handleSwitch = (workspaceId: string) => {
        localStorage.setItem('selectedWorkspaceId', workspaceId);
        setIsOpen(false);

        // Preserve last visited project logic
        const lastProjects = JSON.parse(localStorage.getItem('lastProjectsPerWorkspace') || '{}');
        const lastProjectId = lastProjects[workspaceId];

        if (lastProjectId) {
            router.push(`/projects/${lastProjectId}`);
            setTimeout(() => window.location.reload(), 100);
        } else {
            router.push('/dashboard');
            setTimeout(() => window.location.reload(), 100);
        }
    };

    const getInitials = (name: string) => name.substring(0, 1).toUpperCase();

    const hasMultipleWorkspaces = workspaces.length > 1;

    const handleTriggerClick = (e: React.MouseEvent) => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <button
                onClick={handleTriggerClick}
                className={`flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-all group \${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? currentWorkspace?.name : undefined}
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shrink-0"
                    style={{ backgroundColor: currentWorkspace?.color || 'var(--color-primary)' }}
                >
                    {currentWorkspace ? getInitials(currentWorkspace.name) : 'P'}
                </div>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-foreground font-medium text-sm truncate max-w-[120px] tracking-tight">
                            {currentWorkspace?.name || 'Loading...'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-72 bg-surface border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
                    >
                        <div className="p-2 space-y-1">
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Workspaces
                            </div>

                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {workspaces.map((ws) => (
                                    <button
                                        key={ws.id}
                                        onClick={() => handleSwitch(ws.id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all hover:bg-white/5 group \${ws.id === currentWorkspace?.id ? 'bg-primary/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                style={{ backgroundColor: ws.color || 'var(--color-primary)' }}
                                            >
                                                {getInitials(ws.name)}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-foreground truncate max-w-[140px]">{ws.name}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Shield className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[10px] text-slate-500 font-medium">{ws.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {ws.id === currentWorkspace?.id && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="h-px bg-white/5 my-2" />

                            {/* Actions */}
                            <button
                                onClick={() => { setIsOpen(false); onOpenModal(); }}
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-primary hover:bg-primary/10 transition-all font-medium text-sm"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                Create Workspace
                            </button>

                            {(currentWorkspace?.role === 'Admin' || currentWorkspace?.role === 'Owner') && (
                                <button
                                    onClick={() => { setIsOpen(false); router.push('/settings/workspace'); }}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-400 hover:bg-white/5 transition-all text-sm"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    Workspace Settings
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkspaceSwitcher;
