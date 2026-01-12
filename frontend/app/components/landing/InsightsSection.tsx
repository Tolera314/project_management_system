'use client';

import { motion } from 'framer-motion';
import { PieChart, TrendingUp, AlertCircle } from 'lucide-react';

export default function InsightsSection() {
    return (
        <section className="py-24 px-6 bg-surface/20">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <div className="relative">
                        <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Project Health</h3>
                                <button className="text-xs px-3 py-1 bg-surface-secondary rounded-full hover:bg-border transition-colors">7 Days</button>
                            </div>

                            <div className="flex items-end gap-2 h-48">
                                {[40, 70, 50, 90, 65, 85, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                        className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-sm"
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background p-4 rounded-xl border border-border flex items-center gap-3">
                                    <div className="p-2 bg-success/10 rounded-lg text-success">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-text-primary">98%</div>
                                        <div className="text-xs text-text-secondary">On Time</div>
                                    </div>
                                </div>
                                <div className="bg-background p-4 rounded-xl border border-border flex items-center gap-3">
                                    <div className="p-2 bg-warning/10 rounded-lg text-warning">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-text-primary">2</div>
                                        <div className="text-xs text-text-secondary">At Risk</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Know Where Your Projects Stand — Instantly</h2>
                        <p className="text-lg text-text-secondary mb-8">
                            Stop guessing. Get real-time insights into team workload, project status, and potential bottlenecks before they become problems.
                        </p>
                        <ul className="space-y-4">
                            {['Automated weekly reports', 'Resource allocation heatmaps', 'Budget vs Actual tracking'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-text-primary">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
