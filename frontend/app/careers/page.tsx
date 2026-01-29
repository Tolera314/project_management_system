'use client';

import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const jobs = [
    { title: 'Senior Full-Stack Engineer', location: 'Remote', type: 'Full-time', dept: 'Engineering' },
    { title: 'Product Designer', location: 'San Francisco / Remote', type: 'Full-time', dept: 'Design' },
    { title: 'Customer Success Manager', location: 'New York / Remote', type: 'Full-time', dept: 'Support' },
    { title: 'Technical Writer', location: 'Remote', type: 'Contract', dept: 'Product' }
];

export default function CareersPage() {
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
                            Join Our <span className="text-primary">Team</span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Help us build tools that empower teams worldwide. We're a remote-first company passionate about great software.
                        </p>
                    </motion.div>

                    {/* Job Listings */}
                    <div className="space-y-4 mb-16">
                        {jobs.map((job, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                                            <span className="flex items-center gap-2">
                                                <MapPin size={16} />
                                                {job.location}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Clock size={16} />
                                                {job.type}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Briefcase size={16} />
                                                {job.dept}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-all whitespace-nowrap">
                                        Apply Now
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Benefits */}
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Why ProjectOS?</h2>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            {[
                                '🏡 Remote-first culture',
                                '💰 Competitive salary + equity',
                                '🏥 Health, dental, vision',
                                '🌴 Unlimited PTO',
                                '📚 Learning budget',
                                '💻 Latest equipment',
                                '🌍 Annual team retreats',
                                '🚀 Fast-growing startup'
                            ].map((benefit) => (
                                <div key={benefit} className="flex items-center gap-2">
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
