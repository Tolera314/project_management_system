'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Layout, Code2, Megaphone, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';

const templates = [
    {
        title: "Software Development",
        desc: "Agile sprints, bug tracking, and automated CI/CD pipelines.",
        icon: Code2,
        color: "from-blue-500 to-indigo-600",
        stats: "24 Tasks • 4 Milestones",
        bg: "bg-blue-500/5"
    },
    {
        title: "Marketing Campaign",
        desc: "Content calendars, social media scheduling, and asset management.",
        icon: Megaphone,
        color: "from-purple-500 to-pink-600",
        stats: "18 Tasks • 3 Milestones",
        bg: "bg-purple-500/5"
    },
    {
        title: "Product Launch",
        desc: "Go-to-market strategies, PR coordination, and beta testing.",
        icon: Rocket,
        color: "from-orange-500 to-rose-600",
        stats: "32 Tasks • 6 Milestones",
        bg: "bg-orange-500/5"
    }
];

export default function TemplatesSection() {
    return (
        <section id="templates" className="py-32 px-6 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-4">
                            <Sparkles size={16} />
                            <span>Quick Start</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Built-in Templates for Every Team</h2>
                        <p className="text-lg text-text-secondary leading-relaxed">
                            Don't start from scratch. Use our battle-tested templates designed for high-performance teams.
                        </p>
                    </div>
                    <Link
                        href="/templates"
                        className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all group"
                    >
                        Browse All Templates <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.map((template, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative"
                        >
                            <div className={`relative h-full p-8 rounded-[2rem] border border-border bg-surface hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-xl shadow-black/5`}>
                                {/* Gradient Background Blur */}
                                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-gradient-to-br ${template.color}`} />

                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center text-white mb-8 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                                    <template.icon size={28} />
                                </div>

                                <h3 className="text-2xl font-bold mb-4 text-text-primary">{template.title}</h3>
                                <p className="text-text-secondary mb-8 leading-relaxed italic">"{template.desc}"</p>

                                <div className="pt-6 border-t border-border flex items-center justify-between mt-auto">
                                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{template.stats}</span>
                                    <button className="text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white px-3 py-1.5 rounded-lg border border-primary/20 transition-all">
                                        Preview
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-0 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 right-0 translate-x-1/3 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10" />
            </div>
        </section>
    );
}
