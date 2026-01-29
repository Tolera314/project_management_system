'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function SecurityPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Security <span className="text-primary">First</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Your data security is our top priority. We implement industry-leading practices to keep your information safe.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        {[
                            { icon: Shield, title: 'SOC 2 Certified', desc: 'Independently audited for security, availability, and confidentiality.' },
                            { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3).' },
                            { icon: Eye, title: 'GDPR Compliant', desc: 'Full compliance with EU data protection regulations.' },
                            { icon: CheckCircle, title: 'Regular Audits', desc: 'Third-party penetration testing and security audits quarterly.' }
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-surface border border-border rounded-xl p-8"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                                    <item.icon className="text-white" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-text-secondary">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Our Security Practices</h2>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {[
                                'Database backups every 6 hours',
                                'Role-based access control (RBAC)',
                                '2FA/MFA support',
                                'Automatic security updates',
                                'DDoS protection',
                                'Intrusion detection systems',
                                'Employee background checks',
                                'Bug bounty program'
                            ].map((practice) => (
                                <div key={practice} className="flex items-center gap-2">
                                    <CheckCircle className="text-success flex-shrink-0" size={16} />
                                    <span>{practice}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mt-16">
                        <p className="text-text-secondary mb-4">Found a security vulnerability?</p>
                        <a href="mailto:security@projectos.com" className="text-primary hover:text-primary/80 font-medium">
                            Report to security@projectos.com
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
