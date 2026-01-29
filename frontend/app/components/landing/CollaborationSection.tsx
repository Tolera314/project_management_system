'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Users, Activity } from 'lucide-react';
import NextImage from 'next/image';

export default function CollaborationSection() {
    return (
        <section className="py-32 px-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                <div className="order-2 lg:order-1 relative">
                    {/* Abstract Chat UI */}
                    <div className="relative space-y-6">
                        {[
                            { name: "Sarah Chen", role: "Product Manager", msg: "Just finalized the Q1 roadmap. Ready for review?", avatar: "/avatar-1.png" },
                            { name: "Alex Rivera", role: "Lead Dev", msg: "Looks good. I'll start breaking it into tasks.", avatar: "/avatar-2.png" },
                            { name: "Jordan Lee", role: "Design", msg: "Adding the updated mocks to the project folder.", avatar: "/avatar-3.png" }
                        ].map((user, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2, duration: 0.6 }}
                                className={`flex gap-4 p-4 rounded-2xl border shadow-lg ${i === 1 ? 'bg-primary/10 border-primary/20 ml-12' : 'bg-surface border-border'
                                    }`}
                            >
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                                    <NextImage src={user.avatar} alt={user.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-text-primary text-sm">{user.name}</span>
                                        <span className="text-[10px] text-text-secondary uppercase">{user.role}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{user.msg}</p>
                                </div>
                            </motion.div>
                        ))}

                        {/* Floating Interaction Label */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                            className="absolute -top-10 -right-4 p-3 bg-surface border border-border rounded-xl shadow-2xl flex items-center gap-3"
                        >
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-surface relative overflow-hidden">
                                        <NextImage src={`/avatar-${i}.png`} alt="Team" fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-text-primary">+ 12 others online</span>
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
