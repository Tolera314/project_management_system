'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    description?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string, description?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, type, message, description };

        setToasts((prev) => [...prev, newToast]);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-danger" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-warning" />;
            case 'info':
                return <Info className="w-5 h-5 text-primary" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-success/10 border-success/20';
            case 'error':
                return 'bg-danger/10 border-danger/20';
            case 'warning':
                return 'bg-warning/10 border-warning/20';
            case 'info':
                return 'bg-primary/10 border-primary/20';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${getStyles(toast.type)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(toast.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white mb-0.5">
                                        {toast.message}
                                    </p>
                                    {toast.description && (
                                        <p className="text-xs text-text-secondary">
                                            {toast.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="flex-shrink-0 text-text-secondary hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
