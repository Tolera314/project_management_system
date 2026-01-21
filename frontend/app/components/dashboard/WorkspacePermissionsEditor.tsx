'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ShieldCheck, ShieldAlert, Loader2, Save, Search } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface WorkspacePermissionsEditorProps {
    isOpen: boolean;
    onClose: () => void;
    role: any;
    workspaceId: string;
    onUpdate: () => void;
}

export default function WorkspacePermissionsEditor({
    isOpen,
    onClose,
    role,
    workspaceId,
    onUpdate
}: WorkspacePermissionsEditorProps) {
    const [permissionsByGroup, setPermissionsByGroup] = useState<Record<string, any[]>>({});
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        if (!isOpen || !role) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // Fetch all permissions
                const permRes = await fetch('http://localhost:4000/workspaces/permissions/list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const permData = await permRes.json();
                setPermissionsByGroup(permData);

                // Set initial selected permissions from role
                const initialSelected = role.permissions?.map((rp: any) => rp.permission.id) || [];
                setSelectedPermissions(initialSelected);
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
                showToast('error', 'Error', 'Failed to load permissions');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, role, showToast]);

    const handleToggle = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:4000/workspaces/${workspaceId}/roles/${role.id}/permissions`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ permissionIds: selectedPermissions })
            });

            if (res.ok) {
                showToast('success', 'Permissions Updated', `Successfully updated permissions for ${role.name}`);
                onUpdate();
                onClose();
            } else {
                const data = await res.json();
                showToast('error', 'Update Failed', data.error || 'Failed to update permissions');
            }
        } catch (error) {
            console.error('Save permissions error:', error);
            showToast('error', 'Error', 'An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Edit Permissions</h2>
                                <p className="text-sm text-slate-400">Managing role: <span className="text-primary font-bold">{role?.name}</span></p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search bar */}
                    <div className="px-8 py-4 border-b border-white/5 bg-slate-900/50">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search permissions (e.g. 'task', 'member')..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/30">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px] font-black">Fetching permission manifests...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.entries(permissionsByGroup).map(([group, perms]) => {
                                    const filteredPerms = perms.filter(p =>
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    if (filteredPerms.length === 0) return null;

                                    return (
                                        <div key={group} className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">{group}</h3>
                                            <div className="space-y-2">
                                                {filteredPerms.map((p) => (
                                                    <label
                                                        key={p.id}
                                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selectedPermissions.includes(p.id)
                                                                ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                                                                : 'bg-white/5 border-white/5 hover:border-white/10'
                                                            }`}
                                                    >
                                                        <div className="mt-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissions.includes(p.id)}
                                                                onChange={() => handleToggle(p.id)}
                                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-slate-900"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-200">{p.name.replace(/_/g, ' ')}</span>
                                                            {p.description && (
                                                                <span className="text-xs text-slate-500 leading-tight mt-0.5">{p.description}</span>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Shield size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">{selectedPermissions.length} Active Permissions</span>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Manifest
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
