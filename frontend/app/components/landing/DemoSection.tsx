'use client';

import { motion } from 'framer-motion';
import { Play, CheckCircle2, Layout, Database, Shield } from 'lucide-react';
import NextImage from 'next/image';

export default function DemoSection() {
    return (
        <section id="demo" className="py-32 bg-surface relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">See ProjectOS in Action</h2>
                    <p className="text-lg text-text-secondary leading-relaxed">
                        Experience the power of streamlined project management. From global admin oversight to granular task execution.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Demo Sidebar/Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        {[
                            {
                                title: "Admin Analytics",
                                desc: "Global visibility into platform usage and workspace health.",
                                icon: Layout,
                                color: "text-blue-500",
                                bg: "bg-blue-500/10"
                            },
                            {
                                title: "Adaptive Workspaces",
                                desc: "Customizable boards, lists, and task structures for any team.",
                                icon: Database,
                                color: "text-purple-500",
                                bg: "bg-purple-500/10"
                            },
                            {
                                title: "Secure Governance",
                                desc: "Role-based access control and MFA-enabled security.",
                                icon: Shield,
                                color: "text-emerald-500",
                                bg: "bg-emerald-500/10"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-surface-secondary border border-border hover:border-primary/30 transition-all group cursor-pointer"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-sm text-text-secondary">{item.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Interactive Frame */}
                    <div className="lg:col-span-8 relative">
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl bg-black group">
                            <NextImage
                                src="/hero-dashboard.png"
                                alt="ProjectOS Demo"
                                fill
                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />

                            {/* Play Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all cursor-pointer">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40"
                                >
                                    <Play size={32} className="ml-1" />
                                </motion.div>
                            </div>

                            {/* Status Bar */}
                            <div className="absolute bottom-6 left-6 right-6 p-4 bg-surface/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-text-primary uppercase tracking-widest">Live Platform Preview</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-primary" />
                                    <span className="text-xs text-text-secondary">v1.2.0 Stable</span>
                                </div>
                            </div>
                        </div>

                        {/* Background Glow */}
                        <div className="absolute -inset-10 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
                    </div>
                </div>
            </div>
        </section>
    );
}
