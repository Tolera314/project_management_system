'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordData) => {
        setIsLoading(true);
        setError(null);
        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, data);
            setIsSuccess(true);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Failed to send reset email');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070514] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[30%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-[#0E0C24] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>

                        {!isSuccess ? (
                            <>
                                <div className="mb-8">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                                        <Mail className="text-indigo-400" size={24} />
                                    </div>
                                    <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                                    <p className="text-slate-400 text-sm">
                                        Enter your email address and we'll send you instructions to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Email Address</label>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="john@example.com"
                                            className="w-full h-12 bg-[#0A061D]/50 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-[#0A061D] transition-all"
                                        />
                                        {errors.email && <span className="text-xs text-rose-500 ml-1">{errors.email.message}</span>}
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                    <CheckCircle className="text-emerald-400" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                                <p className="text-slate-400 text-sm mb-8">
                                    We have sent a password reset link to your email address.
                                </p>
                                <button
                                    onClick={() => setIsSuccess(false)} // Or redirect to login
                                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                                >
                                    Resend email
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
