'use client';

import { useState, useEffect } from 'react';
import { X, Mail, ShieldAlert, Loader2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteToWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onInvite: (email: string, roleId: string) => Promise<void>;
    roles: any[]; // Organization Roles
}

export default function InviteToWorkspaceModal({ isOpen, onClose, workspaceId, onInvite, roles }: InviteToWorkspaceModalProps) {
    const [email, setEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set default role when roles are loaded or modal opens
    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            const defaultRole = roles.find((r: any) => r.name === 'Member') || roles[0];
            setSelectedRole(defaultRole.id);
        }
    }, [roles, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !selectedRole) return;

        try {
            setLoading(true);
            setError(null);
            await onInvite(email, selectedRole);
            onClose();
            setEmail('');
        } catch (err: any) {
            setError(err.message || 'Failed to invite member');
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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-foreground/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                        <div className="p-6 border-b border-foreground/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Building2 size={20} className="text-primary" />
                                Invite to Workspace
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                                    <ShieldAlert size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary/50 transition-colors"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Workspace Role</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {roles
                                        .filter((role) => !role.name.startsWith('Project')) // Show only workspace roles
                                        .map((role) => (
                                            <label
                                                key={role.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedRole === role.id ? 'bg-primary/10 border-primary/50' : 'bg-foreground/5 border-foreground/10 hover:border-foreground/20'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={role.id}
                                                        checked={selectedRole === role.id}
                                                        onChange={(e) => setSelectedRole(e.target.value)}
                                                        className="accent-primary"
                                                    />
                                                    <span className={`text-sm font-medium ${selectedRole === role.id ? 'text-primary' : 'text-text-secondary'}`}>{role.name}</span>
                                                </span>
                                                {role.name === 'Admin' && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Admin</span>}
                                                {role.description && <span className="text-xs text-text-secondary ml-2">{role.description}</span>}
                                            </label>
                                        ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email || !selectedRole}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Invitation'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
