'use client';

import { motion } from 'framer-motion';
import { Target, Users, Zap, Heart } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Building the <span className="text-primary">Future</span> of Work
                        </h1>
                        <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                            ProjectOS is on a mission to make project management accessible, powerful, and delightful for teams of all sizes.
                        </p>
                    </motion.div>

                    {/* Mission & Values */}
                    <div className="grid md:grid-cols-2 gap-12 mb-20">
                        {[
                            { icon: Target, title: 'Our Mission', desc: 'Empower teams to deliver exceptional work through intuitive, scalable project management tools.' },
                            { icon: Users, title: 'Our Vision', desc: 'A world where every team can collaborate seamlessly without technical barriers.' },
                            { icon: Zap, title: 'Our Approach', desc: 'Fast iteration, user feedback, and cutting-edge technology guide everything we build.' },
                            { icon: Heart, title: 'Our Values', desc: 'Transparency, simplicity, and user success are at the core of every decision.' }
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-6"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                    <item.icon className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-text-secondary">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-12 mb-20">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            {[
                                { value: '2M+', label: 'Users' },
                                { value: '5000+', label: 'Concurrent Requests' },
                                { value: '99.9%', label: 'Uptime' },
                                { value: '24/7', label: 'Support' }
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                                    <div className="text-text-secondary text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-6">Join Us on Our Journey</h2>
                        <p className="text-text-secondary mb-8">We're hiring talented people to help build the future of work.</p>
                        <Link
                            href="/careers"
                            className="inline-block px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary/25"
                        >
                            View Open Positions
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
