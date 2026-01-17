'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-sm text-text-secondary mb-8">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        v2.0 is now live
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground">
                        Plan. Track. Deliver.<br />
                        <span className="text-primary">Without the Chaos.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                        Organize projects, manage tasks, and keep your team aligned from one powerful workspace.
                        No complex setup required.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            href="/signup"
                            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 group"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-surface-secondary hover:bg-border border border-border text-text-primary rounded-xl font-semibold transition-all">
                            View Demo
                        </button>
                    </div>
                </motion.div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-6xl"
                >
                    <div className="absolute -inset-1 bg-gradient-to-b from-primary/30 to-transparent rounded-2xl blur-2xl opacity-50" />
                    <div className="relative bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
                        {/* Mock Header */}
                        <div className="h-12 border-b border-border bg-surface-secondary flex items-center px-4 gap-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20" />
                            </div>
                            <div className="h-2 w-32 bg-border rounded-full" />
                        </div>

                        {/* Mock Content */}
                        <div className="flex h-full">
                            {/* Sidebar */}
                            <div className="w-64 border-r border-border bg-surface-secondary/50 hidden md:block p-4 space-y-3">
                                <div className="h-2 w-24 bg-border rounded-full mb-6" />
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-3 opacity-60">
                                        <div className="w-4 h-4 rounded bg-border" />
                                        <div className="h-2 w-32 bg-border rounded-full" />
                                    </div>
                                ))}
                            </div>

                            {/* Main Area */}
                            <div className="flex-1 p-6 md:p-8">
                                <div className="flex justify-between items-end mb-8">
                                    <div className="space-y-3">
                                        <div className="h-8 w-64 bg-border rounded-lg" />
                                        <div className="h-2 w-96 bg-border/60 rounded-full" />
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-surface-secondary border-2 border-surface ring-2 ring-border" />
                                        ))}
                                    </div>
                                </div>

                                {/* Kanban Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {['To Do', 'In Progress', 'Done'].map((col, i) => (
                                        <div key={col} className="bg-surface-secondary/30 rounded-xl p-4 border border-border">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-text-secondary' : i === 1 ? 'bg-primary' : 'bg-success'}`} />
                                                <span className="text-sm font-medium text-text-secondary">{col}</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-24 bg-surface border border-border rounded-lg p-3 shadow-sm">
                                                    <div className="h-2 w-3/4 bg-border rounded-full mb-2" />
                                                    <div className="h-2 w-1/2 bg-border/60 rounded-full" />
                                                </div>
                                                {i < 2 && (
                                                    <div className="h-24 bg-surface border border-border rounded-lg p-3 shadow-sm opacity-60">
                                                        <div className="h-2 w-2/3 bg-border rounded-full mb-2" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
