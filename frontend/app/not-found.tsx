'use client';

import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#4F46E515,_transparent_60%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-md mx-auto px-6 text-center">
                {/* Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <FileQuestion className="w-12 h-12 text-text-secondary" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        This page doesn't exist yet
                    </h1>
                    <p className="text-text-secondary text-base mb-8 leading-relaxed">
                        The page you're looking for isn't available or hasn't been created yet.
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Dashboard
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
