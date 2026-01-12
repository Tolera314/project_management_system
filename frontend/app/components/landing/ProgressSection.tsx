'use client';

import { motion } from 'framer-motion';

export default function ProgressSection() {
    return (
        <section className="py-24 px-6 bg-background relative border-t border-border">
            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center max-w-3xl mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Stay On Track, Without Micromanaging</h2>
                    <p className="text-text-secondary text-lg">
                        Monitor deadlines, time tracking, and milestones at a glance.
                    </p>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        {['Design Core System', 'User Testing Phase', 'Production Deploy'].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item}</span>
                                    <span className="text-text-secondary">{85 - (i * 15)}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${85 - (i * 15)}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-4 pt-4">
                            <div className="flex-1 p-4 bg-surface rounded-xl border border-border">
                                <div className="text-2xl font-bold text-text-primary mb-1">12</div>
                                <div className="text-xs text-text-secondary uppercase tracking-wider">Pending Tasks</div>
                            </div>
                            <div className="flex-1 p-4 bg-surface rounded-xl border border-border">
                                <div className="text-2xl font-bold text-success mb-1">0</div>
                                <div className="text-xs text-text-secondary uppercase tracking-wider">Overdue</div>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[400px] w-full bg-surface border border-border rounded-2xl p-6 shadow-2xl flex flex-col justify-end">
                        {/* Gantt Chart Simulation */}
                        <div className="space-y-4 mb-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-24 h-2 bg-surface-secondary rounded" />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(i * 15) + 20}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-6 rounded bg-surface-secondary ${i === 2 ? 'bg-primary/50' : ''}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-border pt-4 flex justify-between text-xs text-text-secondary font-mono">
                            <span>DEC 01</span>
                            <span>DEC 15</span>
                            <span>JAN 01</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
