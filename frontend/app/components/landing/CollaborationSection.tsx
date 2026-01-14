'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Users, Activity } from 'lucide-react';

export default function CollaborationSection() {
    return (
        <section className="py-32 px-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                <div className="order-2 lg:order-1 relative">
                    {/* Abstract Chat UI */}
                    <div className="relative space-y-6">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2, duration: 0.6 }}
                                className={`flex gap-4 p-4 rounded-2xl border ${i === 2 ? 'bg-primary/10 border-primary/20 ml-12' : 'bg-surface border-border'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 border border-border" />
                                <div className="flex-1">
                                    <div className="h-3 w-24 bg-border rounded mb-2" />
                                    <div className="h-2 w-full bg-surface-secondary rounded mb-1" />
                                    <div className="h-2 w-2/3 bg-surface-secondary rounded" />
                                </div>
                            </motion.div>
                        ))}

                        {/* Floating Avatars */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                            className="absolute -top-10 -right-10 p-3 bg-surface border border-border rounded-xl shadow-2xl"
                        >
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-surface bg-gradient-to-br from-blue-500 to-purple-600" />
                                ))}
                                <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-secondary flex items-center justify-center text-xs text-text-primary font-bold">
                                    +5
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Clear Communication,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Fewer Meetings</span>
                        </h2>
                        <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                            Keep conversations contextual. Comment directly on tasks, mention teammates, and watch your inbox reach zero.
                        </p>

                        <ul className="space-y-6">
                            {[
                                { icon: MessageSquare, text: "Threaded comments & @mentions" },
                                { icon: Users, text: "Real-time presence indicators" },
                                { icon: Activity, text: "Role-based project permissions" }
                            ].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex items-center gap-4 text-text-primary font-medium"
                                >
                                    <div className="p-2 rounded-lg bg-surface-secondary text-primary">
                                        <item.icon size={20} />
                                    </div>
                                    {item.text}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
