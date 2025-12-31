'use client';

import { motion } from 'framer-motion';
import { Layers, List, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';

const features = [
    {
        id: 1,
        icon: Layers,
        title: "Projects",
        desc: "Organize work with clear goals and timelines.",
        color: "text-primary"
    },
    {
        id: 2,
        icon: List,
        title: "Lists",
        desc: "Group related tasks to keep workflows logical.",
        color: "text-accent"
    },
    {
        id: 3,
        icon: CheckSquare,
        title: "Tasks",
        desc: "Break down deliverables with ownership and priority.",
        color: "text-success"
    }
];

export default function FeaturesSection() {
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="features" className="py-24 px-6 bg-background relative">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Everything Your Team Needs,<br />
                            <span className="text-primary">In One System</span>
                        </h2>
                        <p className="text-lg text-text-secondary mb-12">
                            From high-level roadmaps to the smallest subtask, ProjectOS scales with your ambition.
                        </p>

                        <div className="space-y-6">
                            {features.map((feature, index) => {
                                const isActive = index === activeFeature;
                                return (
                                    <div
                                        key={feature.id}
                                        onClick={() => setActiveFeature(index)}
                                        className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${isActive ? 'bg-surface border-primary/20 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-white/5'}`}>
                                                <feature.icon className={`w-6 h-6 ${isActive ? feature.color : 'text-text-secondary'}`} />
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-semibold mb-1 ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                                                    {feature.title}
                                                </h3>
                                                <p className="text-text-secondary text-sm md:text-base">
                                                    {feature.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative h-[600px] w-full bg-surface rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Dynamic UI based on active feature */}
                        <div className="h-14 border-b border-white/10 bg-white/5 flex items-center px-6 justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                            </div>
                            <div className="text-xs font-mono text-text-secondary">PROJECT_OS_VIEWER</div>
                        </div>

                        <div className="p-8 flex-1 relative">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{
                                        opacity: activeFeature === index ? 1 : 0,
                                        scale: activeFeature === index ? 1 : 0.95,
                                        pointerEvents: activeFeature === index ? 'auto' : 'none'
                                    }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-8"
                                >
                                    {/* Mock UI Content */}
                                    <div className="h-8 w-48 bg-white/10 rounded-lg mb-8 animate-pulse" />
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map((Line) => (
                                            <div key={Line} className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-white/5">
                                                <div className={`w-5 h-5 rounded border ${activeFeature === index ? 'border-primary' : 'border-white/20'}`} />
                                                <div className="h-2 flex-1 bg-white/10 rounded-full" />
                                                <div className="w-8 h-8 rounded-full bg-white/5" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
