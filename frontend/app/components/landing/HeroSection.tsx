'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground">
                        Plan. Track. Deliver.<br />
                        <span className="text-primary">Without the Chaos.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                        Organize projects, manage tasks, and keep your team aligned from one powerful workspace.
                        No complex setup required.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            href="/signup"
                            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 group"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link // Changed button to Link
                            href="#demo" // Added href for demo section
                            className="w-full sm:w-auto px-8 py-4 bg-surface-secondary hover:bg-border border border-border text-text-primary rounded-xl font-semibold transition-all"
                        >
                            View Demo
                        </Link>
                    </div>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="relative mt-20 max-w-7xl mx-auto px-4"
                >
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-surface shadow-2xl group p-2 md:p-4 bg-gradient-to-b from-white/5 to-transparent">
                        {/* Browser Header Mockup */}
                        <div className="h-8 md:h-10 bg-surface-secondary/50 border-b border-border flex items-center px-4 gap-1.5 rounded-t-2xl">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                        </div>
                        <NextImage
                            src="/hero-dashboard.png"
                            alt="ProjectOS Dashboard Preview"
                            width={1400}
                            height={900}
                            className="w-full h-auto rounded-b-2xl shadow-inner"
                            priority
                        />
                    </div>

                    {/* Floating Decorative Elements */}
                    <div className="absolute -top-10 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
                </motion.div>
            </div>


        </section>
    );
}
