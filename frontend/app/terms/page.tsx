'use client';

import { motion } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto prose prose-invert">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-5xl font-bold mb-6">Terms of Service</h1>
                        <p className="text-text-secondary mb-12">Last updated: January 26, 2026</p>

                        <div className="space-y-8 text-foreground">
                            <section>
                                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                                <p className="text-text-secondary">
                                    By accessing ProjectOS, you agree to these terms. If you disagree, please do not use our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">2. User Responsibilities</h2>
                                <p className="text-text-secondary mb-4">You agree to:</p>
                                <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                                    <li>Provide accurate information</li>
                                    <li>Keep your password secure</li>
                                    <li>Not misuse our services</li>
                                    <li>Comply with applicable laws</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">3. Service Availability</h2>
                                <p className="text-text-secondary">
                                    We strive for 99.9% uptime but cannot guarantee uninterrupted service.
                                    We're not liable for service disruptions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">4. Intellectual Property</h2>
                                <p className="text-text-secondary">
                                    All content and software are owned by ProjectOS. You retain ownership of your data.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">5. Termination</h2>
                                <p className="text-text-secondary">
                                    We may suspend or terminate your account for violations. You can cancel anytime with 30 days data retention.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">6. Contact</h2>
                                <p className="text-text-secondary">
                                    Legal questions? Email <a href="mailto:legal@projectos.com" className="text-primary hover:text-primary/80">legal@projectos.com</a>
                                </p>
                            </section>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
