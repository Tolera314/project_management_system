'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Zap, Users, Shield, Clock, BarChart, FileText, Calendar, Bell, Tag, Folder, GitBranch } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const features = [
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Optimized for speed with real-time updates via WebSocket. See changes instantly across your team.',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Built for teams. Mentions, comments, file sharing, and real-time notifications keep everyone in sync.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Role-based permissions, audit logs, and SOC 2 compliance. Your data is safe with bank-level encryption.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: Clock,
        title: 'Time Tracking',
        description: 'Track billable hours directly on tasks. Generate reports and export timesheets with one click.',
        color: 'from-green-500 to-emerald-500'
    },
    {
        icon: BarChart,
        title: 'Advanced Analytics',
        description: 'Burndown charts, velocity tracking, and custom reports. Make data-driven decisions.',
        color: 'from-indigo-500 to-blue-500'
    },
    {
        icon: FileText,
        title: 'Document Management',
        description: 'Upload files, version control, and Cloudinary CDN integration for lightning-fast access.',
        color: 'from-rose-500 to-red-500'
    },
    {
        icon: Calendar,
        title: 'Calendar Integration',
        description: 'View tasks, milestones, and deadlines in a unified calendar. Never miss a deadline.',
        color: 'from-teal-500 to-cyan-500'
    },
    {
        icon: Bell,
        title: 'Smart Notifications',
        description: 'Customizable alerts via email and in-app. Only get notified about what matters to you.',
        color: 'from-amber-500 to-yellow-500'
    },
    {
        icon: Tag,
        title: 'Custom Tags',
        description: 'Organize tasks with unlimited tags. Filter and search across projects with ease.',
        color: 'from-violet-500 to-purple-500'
    },
    {
        icon: Folder,
        title: 'Project Templates',
        description: 'Save project structures as templates. Start new projects in seconds with pre-configured workflows.',
        color: 'from-sky-500 to-blue-500'
    },
    {
        icon: GitBranch,
        title: 'Task Dependencies',
        description: 'Link tasks together with dependencies. Visualize critical paths and blockers.',
        color: 'from-pink-500 to-rose-500'
    },
    {
        icon: Users,
        title: 'Multi-Workspace',
        description: 'Manage multiple teams and clients from one account. Switch workspaces seamlessly.',
        color: 'from-cyan-500 to-teal-500'
    }
];

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Everything You Need to <span className="text-primary">Ship Faster</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                            From planning to delivery, ProjectOS has all the tools your team needs to build exceptional products. No bloat, just power.
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-surface border border-border rounded-2xl p-8 hover:border-primary/50 transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="text-white" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Feature Highlight Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-12 text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Built for Scale. Designed for Speed.
                        </h2>
                        <p className="text-lg text-text-secondary max-w-3xl mx-auto mb-8">
                            Supporting <strong>2M+ users</strong> with <strong>5000+ concurrent requests</strong>.
                            Enterprise-grade infrastructure that never slows down.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="flex items-center gap-2 px-6 py-3 bg-surface/50 rounded-xl border border-border">
                                <CheckCircle className="text-success" size={20} />
                                <span>99.9% Uptime SLA</span>
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-surface/50 rounded-xl border border-border">
                                <CheckCircle className="text-success" size={20} />
                                <span>SOC 2 Certified</span>
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-surface/50 rounded-xl border border-border">
                                <CheckCircle className="text-success" size={20} />
                                <span>GDPR Compliant</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-center mt-20"
                    >
                        <Link
                            href="/signup"
                            className="inline-block px-10 py-5 bg-primary hover:bg-primary/90 text-white text-lg font-semibold rounded-xl transition-all shadow-2xl hover:shadow-primary/40 hover:-translate-y-1"
                        >
                            Start Using ProjectOS Free
                        </Link>
                        <p className="mt-4 text-text-secondary text-sm">
                            No credit card required · Free for teams up to 10 members
                        </p>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
