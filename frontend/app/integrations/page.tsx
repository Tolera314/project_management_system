'use client';

import { motion } from 'framer-motion';
import { Cloud, MessageSquare, FileText, Slack, Github, Trello } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const integrations = [
    { name: 'Slack', icon: Slack, desc: 'Get notifications in your Slack channels', category: 'Communication', status: 'Available' },
    { name: 'GitHub', icon: Github, desc: 'Link commits and PRs to tasks', category: 'Development', status: 'Available' },
    { name: 'Google Drive', icon: Cloud, desc: 'Attach files from Google Drive', category: 'Storage', status: 'Coming Soon' },
    { name: 'Trello', icon: Trello, desc: 'Import boards and cards', category: 'Migration', status: 'Coming Soon' },
    { name: 'Zoom', icon: MessageSquare, desc: 'Start meetings from tasks', category: 'Communication', status: 'Coming Soon' },
    { name: 'Notion', icon: FileText, desc: 'Sync documentation', category: 'Documentation', status: 'Coming Soon' }
];

export default function IntegrationsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Connect Your <span className="text-primary">Favorite Tools</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            ProjectOS integrates with the tools you already use. More integrations added monthly.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {integrations.map((integration, i) => (
                            <motion.div
                                key={integration.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                        <integration.icon size={24} className="text-primary" />
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${integration.status === 'Available'
                                            ? 'bg-success/10 text-success'
                                            : 'bg-text-secondary/10 text-text-secondary'
                                        }`}>
                                        {integration.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">{integration.name}</h3>
                                <p className="text-sm text-text-secondary mb-3">{integration.desc}</p>
                                <span className="text-xs text-text-secondary">{integration.category}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                        <p className="text-text-secondary mb-4">Don't see your tool?</p>
                        <a href="/contact" className="text-primary hover:text-primary/80 font-medium">
                            Request an Integration →
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
