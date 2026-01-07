'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Shield, Lock, FolderLock, Loader2, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { loginSchema, LoginFormData } from '@/lib/schema';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const invitationToken = searchParams.get('invitation');
    const invitedEmail = searchParams.get('email');

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (invitedEmail) {
            setValue('email', invitedEmail);
        }
    }, [invitedEmail, setValue]);

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:4000/auth/login', data);

            // Store token
            const token = response.data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            let redirectUrl = '/dashboard';

            // If there's an invitation, accept it
            if (invitationToken) {
                try {
                    const acceptRes = await axios.post(`http://localhost:4000/invitations/accept/${invitationToken}`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (acceptRes.data.redirectUrl) {
                        redirectUrl = acceptRes.data.redirectUrl;
                    }
                } catch (inviteErr: any) {
                    console.error('Failed to auto-accept invitation:', inviteErr);
                    // Continue to dashboard anyway, maybe show a toast later
                }
            }

            setTimeout(() => {
                router.push(redirectUrl);
            }, 800);

        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Login failed');
            } else {
                setError('Something went wrong. Please try again.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Enhanced Background */}
            <div className="absolute inset-0 bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#4F46E520,_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_#A78BFA15,_transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full p-6 text-center">
                <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-text-secondary inline-block">
                    ProjectOS
                </Link>
            </header>

            {/* Main Content */}
            <main className="relative z-10 w-full max-w-md mx-auto px-6 flex-1 flex flex-col justify-center py-16 lg:py-20">

                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
                    >
                        Welcome Back
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-text-secondary text-base leading-relaxed"
                    >
                        Sign in to continue managing your projects and teams.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative bg-gradient-to-b from-surface/60 to-surface/40 border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40"
                >
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">Email Address</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="you@company.com"
                                autoComplete="email"
                                className={`w-full bg-background/60 border ${errors.email ? 'border-danger focus:ring-danger/50' : 'border-white/[0.08] focus:border-primary/50'} rounded-xl px-4 py-3.5 text-white placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm`}
                            />
                            {errors.email && (
                                <p className="text-xs text-danger flex items-center gap-1.5">
                                    <X className="w-3 h-3" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-text-primary">Password</label>
                                <Link href="/forgot-password" className="text-xs text-text-secondary hover:text-primary transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className={`w-full bg-background/60 border ${errors.password ? 'border-danger focus:ring-danger/50' : 'border-white/[0.08] focus:border-primary/50'} rounded-xl px-4 py-3.5 text-white placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm`}
                            />
                            {errors.password && (
                                <p className="text-xs text-danger flex items-center gap-1.5">
                                    <X className="w-3 h-3" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                    </form>
                </motion.div>

                {/* Trust Signals - Reduced Emphasis */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mt-10 flex justify-center gap-8 text-text-secondary/40"
                >
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="opacity-70" />
                        <span className="text-[11px] font-medium">Secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FolderLock size={14} className="opacity-70" />
                        <span className="text-[11px] font-medium">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock size={14} className="opacity-70" />
                        <span className="text-[11px] font-medium">Private</span>
                    </div>
                </motion.div>

                {/* Sign Up Redirect */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="text-center mt-8 text-text-secondary/80 text-sm"
                >
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-white font-medium hover:text-primary transition-colors">
                        Sign up
                    </Link>
                </motion.p>

            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full p-6 text-center">
                <div className="flex justify-center gap-6 text-[11px] text-text-secondary/50 mb-2">
                    <Link href="#" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-white/70 transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-white/70 transition-colors">Security</Link>
                </div>
                <p className="text-[10px] text-text-secondary/40">
                    © 2025 Project Management System
                </p>
            </footer>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
