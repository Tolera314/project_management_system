'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTASection() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10 pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-bold mb-8"
                >
                    Bring Clarity to Your Projects Today
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <Link
                        href="/signup"
                        className="inline-block px-10 py-5 bg-primary hover:bg-primary/90 text-white text-lg font-semibold rounded-xl transition-all shadow-2xl hover:shadow-primary/40 hover:-translate-y-1"
                    >
                        Start Your Workspace
                    </Link>
                    <p className="mt-4 text-text-secondary text-sm">No credit card required · Free for small teams</p>
                </motion.div>
            </div>
        </section>
    );
}
