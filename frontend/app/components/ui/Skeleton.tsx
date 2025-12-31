'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`relative overflow-hidden bg-white/5 rounded-lg ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="p-6 bg-surface/50 border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-surface/30 border border-white/5 rounded-xl">
                    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 bg-surface/50 border border-white/5 rounded-2xl space-y-4">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
