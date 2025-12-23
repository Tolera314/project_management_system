'use client';

import { Shield, Lock, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecuritySection() {
    return (
        <section className="py-24 px-6 bg-background">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for Real Teams, Real Work</h2>
                <p className="text-text-secondary max-w-2xl mx-auto">
                    Security isn't an afterthought. It's our foundation.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { icon: Shield, title: "Role-Based Access", desc: "Granular permissions for every member." },
                    { icon: Lock, title: "Encryption", desc: "AES-256 encryption at rest and in transit." },
                    { icon: Activity, title: "Audit Logs", desc: "Track every action with immutable history." },
                    { icon: Globe, title: "Data Residency", desc: "Compliant with GDPR, SOC2, and HIPAA." }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-xl bg-surface/50 border border-white/5 text-center hover:bg-surface/80 transition-colors"
                    >
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <item.icon size={24} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-text-secondary">{item.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
