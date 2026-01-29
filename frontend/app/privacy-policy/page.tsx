'use client';

import { motion } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto prose prose-invert">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-5xl font-bold mb-6">Privacy Policy</h1>
                        <p className="text-text-secondary mb-12">Last updated: January 26, 2026</p>

                        <div className="space-y-8 text-foreground">
                            <section>
                                <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                                <p className="text-text-secondary">
                                    We collect information you provide directly to us, including name, email, and project data.
                                    We also collect usage data to improve our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                                <p className="text-text-secondary mb-4">We use your information to:</p>
                                <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                                    <li>Provide and maintain our services</li>
                                    <li>Send you updates and notifications</li>
                                    <li>Improve our platform</li>
                                    <li>Ensure security and prevent fraud</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">3. Data Storage & Security</h2>
                                <p className="text-text-secondary">
                                    Your data is encrypted at rest and in transit. We use industry-standard security measures
                                    including SOC 2 compliance and regular security audits.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">4. GDPR Compliance</h2>
                                <p className="text-text-secondary">
                                    For European users, we comply with GDPR. You have the right to access, correct, or delete your data.
                                    Contact us at privacy@projectos.com to exercise these rights.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">5. Cookies</h2>
                                <p className="text-text-secondary">
                                    We use essential cookies for authentication and analytics. You can control cookie preferences in your browser.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
                                <p className="text-text-secondary">
                                    Questions about privacy? Email us at <a href="mailto:privacy@projectos.com" className="text-primary hover:text-primary/80">privacy@projectos.com</a>
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
