'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, User, Shield, Check, AlertCircle } from 'lucide-react';
import { AdminService } from '../../services/admin.service';

interface ProvisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProvisionModal({ isOpen, onClose, onSuccess }: ProvisionModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        ownerEmail: '',
        plan: 'FREE',
        color: '#4F46E5'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await AdminService.provisionWorkspace(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Provisioning failed. Ensure the owner email is a registered user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Globe size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">New System Provision</h2>
                            </div>
                            <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex gap-3 text-danger text-sm">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Workspace Name</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            placeholder="e.g. Acme Corp Digital"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Owner Email</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            required
                                            type="email"
                                            value={formData.ownerEmail}
                                            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                            className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            placeholder="owner@example.com"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-secondary mt-1.5 flex items-center gap-1 italic">
                                        <Shield size={10} /> Must correspond to an existing system user.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Service Plan</label>
                                        <select
                                            value={formData.plan}
                                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                            className="w-full bg-foreground/[0.03] border border-border rounded-xl py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="FREE">Free Tier</option>
                                            <option value="BUSINESS">Business</option>
                                            <option value="ENTERPRISE">Enterprise</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Brand Color</label>
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full h-[42px] bg-foreground/[0.03] border border-border rounded-xl p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-foreground/[0.05] hover:bg-foreground/[0.1] text-text-primary rounded-2xl text-sm font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Provisioning...' : (
                                        <>
                                            <Check size={18} />
                                            Start Provision
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
