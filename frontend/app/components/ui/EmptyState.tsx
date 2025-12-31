'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    children?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-12 text-center"
        >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <Icon className="w-10 h-10 text-text-secondary" />
            </div>

            {/* Text */}
            <h3 className="text-xl font-semibold text-white mb-3">
                {title}
            </h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {description}
            </p>

            {/* Action or Custom Content */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-lg text-sm font-medium transition-all"
                >
                    {action.label}
                </button>
            )}

            {children}
        </motion.div>
    );
}
