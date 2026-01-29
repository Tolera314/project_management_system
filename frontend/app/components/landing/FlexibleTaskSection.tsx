'use client';

import { motion } from 'framer-motion';
import { Kanban, List, GanttChartSquare, Settings2 } from 'lucide-react';

const cards = [
    {
        icon: Kanban,
        title: "Kanban Board",
        desc: "Visualize workflow stages.",
        delay: 0
    },
    {
        icon: List,
        title: "List View",
        desc: "Detailed structured planning.",
        delay: 0.1
    },
    {
        icon: GanttChartSquare,
        title: "Timeline View",
        desc: "Map out deadlines.",
        delay: 0.2
    },
    {
        icon: Settings2,
        title: "Custom Workflows",
        desc: "Adapt to your unique process.",
        delay: 0.3
    }
];

export default function FlexibleTaskSection() {
    return (
        <section id="workflow" className="py-24 px-6 bg-surface-secondary/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Work the Way Your Team Works</h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Switch between views instantly to see your work from every angle.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: card.delay }}
                            className="group p-6 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-colors hover:shadow-xl hover:shadow-primary/5"
                        >
                            <div className="w-12 h-12 bg-surface-secondary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <card.icon className="w-6 h-6 text-text-primary group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                            <p className="text-text-secondary text-sm">{card.desc}</p>

                            {/* Micro Interaction Visual */}
                            <div className="mt-6 h-24 bg-background/50 rounded-lg overflow-hidden relative border border-border group-hover:border-primary/20 transition-colors">
                                <div className="absolute top-3 left-3 right-3 h-2 bg-border rounded-full" />
                                <div className="absolute top-8 left-3 w-1/2 h-2 bg-border/50 rounded-full" />
                                <motion.div
                                    className="absolute bottom-3 right-3 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
