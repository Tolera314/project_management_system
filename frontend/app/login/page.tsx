'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Eye, EyeOff, Globe, Rocket, Shield, Cloud, Lock } from 'lucide-react';
import Link from 'next/link';
import { loginSchema, LoginFormData } from '@/lib/schema';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { File } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

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

            let redirectUrl = response.data.user.systemRole === 'ADMIN' ? '/admin' : '/dashboard';

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
                }
            }

            setTimeout(() => {
                // If the user has no workspace, they will be prompted on the dashboard
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

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:4000/auth/google';
    };

    return (
        <div className="min-h-screen bg-[#070514] flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[30%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Brand Logo - Centered Top */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 flex flex-col items-center gap-2 z-10"
            >
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <File className="text-white fill-white" size={24} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">ProjectOS</h1>
            </motion.div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full max-w-[420px] bg-[#0E0C24] border border-white/5 rounded-[32px] p-8 shadow-2xl relative z-10"
            >
                {/* Inner gradient glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[32px] pointer-events-none" />

                <div className="mb-8 text-left">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400 text-sm">Enter your credentials to access your workspace.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 ml-1">Email Address</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        {errors.email && <span className="text-xs text-rose-500">{errors.email.message}</span>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-slate-400 ml-1">Password</label>
                        </div>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors pr-8"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className="text-xs text-rose-500">{errors.password.message}</span>}
                    </div>

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors font-medium">
                            Forgot Password?
                        </Link>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                            <>
                                Continue to Dashboard
                                <ArrowRight size={16} />
                            </>}
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                            <span className="bg-[#0E0C24] px-4 text-slate-600 font-bold">Secure Sign In</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-300 hover:text-white font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <FcGoogle size={20} />
                        Continue with Google
                    </button>

                </form>
            </motion.div>

            {/* Footer */}
            <div className="mt-8 flex flex-col items-center gap-6 z-10">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                    New here? <Link href="/signup" className="text-white font-bold hover:text-purple-400 transition-colors flex items-center">Create an account <span className="ml-1 text-lg">+</span></Link>
                </div>

                <div className="flex gap-6 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Shield size={10} /> Encryption</div>
                    <div className="flex items-center gap-1.5"><Cloud size={10} /> CloudSync</div>
                    <div className="flex items-center gap-1.5"><Lock size={10} /> Enterprise</div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070514] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
