'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Save, Check } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { API_BASE_URL } from '../../config/api.config';

const workspaceColors = [
    '#4F46E5', '#A78BFA', '#3B82F6', '#10B981',
    '#F59E0B', '#EF4444', '#EC4899', '#06B6D4',
];

export default function WorkspaceSettings() {
    const [workspace, setWorkspace] = useState<any>(null);
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(workspaceColors[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        const fetchWorkspace = async () => {
            const token = localStorage.getItem('token');
            const selectedId = localStorage.getItem('selectedWorkspaceId');
            if (!token) return;

            try {
                const url = selectedId
                    ? `${API_BASE_URL}/workspaces/me?workspaceId=${selectedId}`
                    : `${API_BASE_URL}/workspaces/me`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.workspace) {
                    setWorkspace(data.workspace);
                    setName(data.workspace.name);
                    setSelectedColor(data.workspace.color || workspaceColors[0]);
                }
            } catch (error) {
                console.error('Failed to fetch workspace:', error);
            }
        };

        fetchWorkspace();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSuccessMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, color: selectedColor })
            });

            if (res.ok) {
                setSuccessMessage('Workspace updated successfully!');
                // Update local cache if needed, though a refresh is often better
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const data = await res.json();
                showToast('error', 'Update Failed', data.error || 'Failed to update workspace');
            }
        } catch (error) {
            console.error('Save workspace error:', error);
            showToast('error', 'Update Failed', 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (!workspace) return <div className="animate-pulse space-y-4">
        <div className="h-10 bg-white/5 rounded-lg w-1/3" />
        <div className="h-64 bg-white/5 rounded-2xl" />
    </div>;

    return (
        <div className="space-y-8">
            <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl"
                            style={{ backgroundColor: selectedColor }}
                        >
                            {name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">General Settings</h2>
                            <p className="text-sm text-slate-400">Update your workspace identity and appearance.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                <Type className="w-4 h-4" />
                                Workspace Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                <Palette className="w-4 h-4" />
                                Workspace Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {workspaceColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative ${selectedColor === color ? 'ring-2 ring-white ring-offset-4 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                    >
                                        {selectedColor === color && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 flex items-center gap-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !name}
                                className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            {successMessage && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-emerald-400 text-sm font-medium"
                                >
                                    {successMessage}
                                </motion.span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
