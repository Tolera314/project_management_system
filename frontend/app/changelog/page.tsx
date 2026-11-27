'use client';

import { motion } from 'framer-motion';
import { Rocket, Bug, Zap, Wrench } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const releases = [
    {
        version: 'v2.1.0',
        date: 'January 20, 2026',
        changes: [
            { type: 'feature', icon: Rocket, text: 'Added time tracking with billable hours' },
            { type: 'feature', icon: Rocket, text: 'Task watchers for real-time notifications' },
            { type: 'feature', icon: Rocket, text: 'Password strength indicator on signup' },
            { type: 'improvement', icon: Zap, text: 'Improved dashboard load time by 40%' },
            { type: 'fix', icon: Bug, text: 'Fixed Google OAuth redirect issue' }
        ]
    },
    {
        version: 'v2.0.0',
        date: 'January 1, 2026',
        changes: [
            { type: 'feature', icon: Rocket, text: 'Cloudinary integration for file uploads' },
            { type: 'feature', icon: Rocket, text: 'Enterprise connection pooling (100 connections)' },
            { type: 'feature', icon: Rocket, text: 'Advanced analytics dashboards' },
            { type: 'improvement', icon: Zap, text: 'Complete UI redesign with dark mode' }
        ]
    }
];

export default function ChangelogPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Product <span className="text-primary">Changelog</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            See what's new in ProjectOS. We ship updates every week.
                        </p>
                    </motion.div>

                    {/* Releases */}
                    <div className="space-y-12">
                        {releases.map((release, i) => (
                            <motion.div
                                key={release.version}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-3xl font-bold">{release.version}</h2>
                                    <span className="text-text-secondary">{release.date}</span>
                                </div>
                                <div className="space-y-4">
                                    {release.changes.map((change, j) => (
                                        <div key={j} className="flex items-start gap-4 bg-surface border border-border rounded-xl p-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${change.type === 'feature' ? 'bg-blue-500/10 text-blue-500' :
                                                    change.type === 'improvement' ? 'bg-green-500/10 text-green-500' :
                                                        'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                <change.icon size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-foreground">{change.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
