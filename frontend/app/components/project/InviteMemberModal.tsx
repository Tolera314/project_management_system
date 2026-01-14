'use client';

import { useState } from 'react';
import { X, Mail, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onInvite: (email: string, roleId: string) => Promise<void>;
    roles: any[]; // Project Roles
    workspaceMembers?: any[];
    projectMembers?: any[];
}

export default function InviteMemberModal({ isOpen, onClose, projectId, onInvite, roles, workspaceMembers = [], projectMembers = [] }: InviteMemberModalProps) {
    const [query, setQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState(roles.find((r: any) => r.name === 'Member')?.id || roles[0]?.id || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter potential addable members (in workspace but not in project)
    const addableMembers = workspaceMembers.filter((wm: any) =>
        !projectMembers.some((pm: any) => pm.organizationMember.id === wm.id)
    );

    const filteredMembers = query === ''
        ? addableMembers
        : addableMembers.filter((m: any) =>
            m.user.firstName.toLowerCase().includes(query.toLowerCase()) ||
            m.user.lastName.toLowerCase().includes(query.toLowerCase()) ||
            m.user.email.toLowerCase().includes(query.toLowerCase())
        );

    const isEmail = query.includes('@');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query || !selectedRole) return;

        try {
            setLoading(true);
            setError(null);
            await onInvite(query, selectedRole);
            setSuccess(`Invitation sent to ${query}`);
            setTimeout(() => {
                setSuccess(null);
                onClose();
                setQuery('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to invite member');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMember = async (email: string) => {
        setQuery(email);
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Mail size={20} className="text-primary" />
                                Add to Project
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <X size={20} className="text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                                    <ShieldAlert size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search or Enter Email</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Name or email address"
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/50 transition-colors"
                                        autoFocus
                                    />
                                    {/* Suggestions Dropdown */}
                                    {query && filteredMembers.length > 0 && !isEmail && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                                            {filteredMembers.map((m: any) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => handleSelectMember(m.user.email)}
                                                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                        {m.user.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{m.user.firstName} {m.user.lastName}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{m.role.name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {isEmail && (
                                    <p className="text-xs text-primary/80 flex items-center gap-1 mt-1">
                                        <Mail size={10} />
                                        Inviting external user via email
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Role</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {roles
                                        .filter((role: any) => role.name.startsWith('Project')) // Show only project roles
                                        .map((role: any) => (
                                            <label
                                                key={role.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedRole === role.id ? 'bg-primary/10 border-primary/50' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary/30'}`}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value={role.id}
                                                            checked={selectedRole === role.id}
                                                            onChange={(e) => setSelectedRole(e.target.value)}
                                                            className="accent-primary"
                                                        />
                                                        <span className={`text-sm font-medium ${selectedRole === role.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{role.name}</span>
                                                    </span>
                                                    {role.description && (
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-6">{role.description}</span>
                                                    )}
                                                </div>
                                                {role.name === 'Project Manager' && <span className="text-[10px] bg-blue-500/20 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded-full">Manager</span>}
                                            </label>
                                        ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !query || !selectedRole}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Invite'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
