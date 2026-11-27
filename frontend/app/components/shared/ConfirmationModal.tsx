'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
        primary: 'bg-primary hover:bg-primary/90 shadow-primary/20'
    };

    const iconColors = {
        danger: 'text-rose-500 bg-rose-500/10',
        warning: 'text-amber-500 bg-amber-500/10',
        primary: 'text-primary bg-primary/10'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[variant]}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-secondary transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2.5 ${variantStyles[variant]} text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                            {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
