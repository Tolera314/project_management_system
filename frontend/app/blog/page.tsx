'use client';

import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const articles = [
    { title: '10 Best Practices for Agile Project Management', author: 'Sarah Chen', date: 'Jan 20, 2026', category: 'Best Practices', excerpt: 'Learn how top teams use agile methodologies to ship faster and smarter.' },
    { title: 'How to Scale Your Remote Team', author: 'Mike Johnson', date: 'Jan 15, 2026', category: 'Remote Work', excerpt: 'Proven strategies for managing distributed teams effectively.' },
    { title: 'The Future of Project Management Software', author: 'Emily Rodriguez', date: 'Jan 10, 2026', category: 'Trends', excerpt: 'AI, automation, and what\'s next for project management tools.' },
    { title: 'Mastering Task Dependencies', author: 'David Park', date: 'Jan 5, 2026', category: 'Features', excerpt: 'A deep dive into managing complex project dependencies.' }
];

export default function BlogPage() {
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
                            The ProjectOS <span className="text-primary">Blog</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Insights, tutorials, and best practices for modern project management.
                        </p>
                    </motion.div>

                    {/* Articles */}
                    <div className="space-y-8">
                        {articles.map((article, i) => (
                            <motion.article
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-surface border border-border rounded-xl p-8 hover:border-primary/50 transition-all group"
                            >
                                <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">
                                        {article.category}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        {article.date}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <User size={16} />
                                        {article.author}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                                    {article.title}
                                </h2>
                                <p className="text-text-secondary mb-4">{article.excerpt}</p>
                                <Link href="#" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all">
                                    Read more
                                    <ArrowRight size={16} />
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
