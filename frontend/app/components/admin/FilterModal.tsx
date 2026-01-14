'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterValues) => void;
    initialFilters: FilterValues;
}

export interface FilterValues {
    role?: string;
    status?: string;
    mfaEnabled?: string;
    minWorkspaces?: string;
}

export default function FilterModal({
    isOpen,
    onClose,
    onApply,
    initialFilters
}: FilterModalProps) {
    const [filters, setFilters] = useState<FilterValues>(initialFilters);

    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {
            role: 'ALL',
            status: 'ALL',
            mfaEnabled: '',
            minWorkspaces: ''
        };
        setFilters(resetFilters);
        onApply(resetFilters);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="relative bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-6">
                        Advanced Filters
                    </h2>

                    {/* Filters */}
                    <div className="space-y-6 mb-8">
                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Global Role
                            </label>
                            <select
                                value={filters.role || 'ALL'}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="SYSTEM_ADMIN">System Admin</option>
                                <option value="SUPPORT">Support</option>
                                <option value="USER">User</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Account Status
                            </label>
                            <select
                                value={filters.status || 'ALL'}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="PENDING">Pending</option>
                            </select>
                        </div>

                        {/* MFA Filter */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                MFA Status
                            </label>
                            <select
                                value={filters.mfaEnabled || ''}
                                onChange={(e) => setFilters({ ...filters, mfaEnabled: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">All</option>
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>

                        {/* Min Workspaces Filter */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Minimum Workspaces
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={filters.minWorkspaces || ''}
                                onChange={(e) => setFilters({ ...filters, minWorkspaces: e.target.value })}
                                placeholder="Any"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl text-sm font-bold text-white transition-all"
                        >
                            Apply Filters
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
