'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../config/api.config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    if (!token) {
        return (
            <div className="min-h-screen bg-[#070514] flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
                    <p className="text-slate-400 mb-8">This password reset link is invalid or has expired.</p>
                    <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300">
                        Request a new reset link
                    </Link>
                </div>
            </div>
        );
    }

    const onSubmit = async (data: ResetPasswordData) => {
        setIsLoading(true);
        setError(null);
        try {
            await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                token,
                newPassword: data.password
            });
            setIsSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Failed to reset password');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070514] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[30%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-[#0E0C24] border border-white/5 rounded-[32px] p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[32px] pointer-events-none" />

                    {!isSuccess ? (
                        <div className="relative">
                            <div className="mb-8">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                                    <Lock className="text-indigo-400" size={24} />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
                                <p className="text-slate-400 text-sm">
                                    Enter a new password for your account.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="w-full h-12 bg-[#0A061D]/50 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <span className="text-xs text-rose-500 ml-1">{errors.password.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Confirm Password</label>
                                    <input
                                        {...register('confirmPassword')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full h-12 bg-[#0A061D]/50 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                    {errors.confirmPassword && <span className="text-xs text-rose-500 ml-1">{errors.confirmPassword.message}</span>}
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
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="text-center py-8 relative">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <CheckCircle className="text-emerald-400" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Your password has been successfully reset.
                            </p>
                            <p className="text-xs text-slate-500">
                                Redirecting to login...
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070514] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
