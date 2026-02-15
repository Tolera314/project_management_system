'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, Globe, Check } from 'lucide-react';
import Link from 'next/link';
import { signUpSchema, SignUpFormData } from '@/lib/schema';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import UserAvatar from '../components/shared/UserAvatar';
import { FcGoogle } from "react-icons/fc";
import { API_BASE_URL } from '../config/api.config';

// Password strength calculator
const calculatePasswordStrength = (password: string) => {
    const checks = {
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasMinLength: password.length >= 8,
    };

    const strength = Object.values(checks).filter(Boolean).length;
    return { ...checks, strength };
};

function SignUpContent() {
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
        watch,
        setValue,
        formState: { errors },
    } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
    });

    const password = watch('password');

    useEffect(() => {
        if (invitedEmail) {
            setValue('email', invitedEmail);
        }
    }, [invitedEmail, setValue]);

    const onSubmit = async (data: SignUpFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const signupRes = await axios.post(`${API_BASE_URL}/auth/register`, data);

            // Do not store token/user yet, wait for verification
            // localStorage.setItem('token', token);
            // localStorage.setItem('user', JSON.stringify(signupRes.data.user));

            let redirectUrl = `/auth/verify-otp?email=${encodeURIComponent(data.email)}`;

            if (invitationToken) {
                redirectUrl += `&invitation=${invitationToken}`;
            }

            setTimeout(() => {
                router.push(redirectUrl);
            }, 800);

        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Registration failed');
            } else {
                setError('Something went wrong. Please try again.');
            }
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to Backend Google Auth Endpoint
        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-[#0A061D] font-sans selection:bg-purple-500/30">
            {/* Left Side - Marketing (Lumina Style) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F0A29] overflow-hidden flex-col justify-between p-16">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src="/singnup.png" alt="Background" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A29]/80 via-transparent to-[#0F0A29]/90" />
                </div>

                {/* Background Blobs (Kept for extra depth) */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />

                {/* Brand */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                        <div className="grid grid-cols-3 gap-0.5">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-white rounded-full" />
                            ))}
                        </div>
                    </div>
                    <span className="text-xl font-bold text-white tracking-widest">LUMINA</span>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-lg mt-20">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold tracking-wider mb-8 uppercase">
                        Future of Workflow
                    </div>

                    <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                        Redefining <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Collaborative</span> <br />
                        Creativity.
                    </h1>

                    <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md border-l-2 border-indigo-500/50 pl-6">
                        Elevate your project management with an interface designed for modern minds. Simple, powerful, and beautiful.
                    </p>

                    {/* Social Proof */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F0A29] bg-slate-700 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">Join 24,000+ teams</span>
                            <span className="text-slate-500 text-xs">Managing peak performance daily.</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-xs text-slate-600 mt-20">
                    © {new Date().getFullYear()} Lumina Creative Lab. Crafted for visionaries.
                </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#0E0C25]">
                <div className="w-full max-w-[450px] bg-[#151232] rounded-[32px] p-10 border border-white/5 shadow-2xl relative">
                    {/* Glow effect under card */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[32px] pointer-events-none" />

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-slate-400">Enter your details to start the journey.</p>
                    </div>

                    {/* Social Login */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full h-12 rounded-xl bg-[#1E1B4B]/50 hover:bg-[#1E1B4B] border border-white/10 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-3 text-white font-medium mb-8 group"
                    >
                        <FcGoogle size={20} />
                        Google
                    </button>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#151232] px-4 text-slate-500 font-medium tracking-wider">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                {...register('fullName')}
                                placeholder="Johnathon Doe"
                                className="w-full h-12 bg-[#0A061D]/50 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-[#0A061D] transition-all"
                            />
                            {errors.fullName && <span className="text-xs text-rose-500 ml-1">{errors.fullName.message}</span>}
                        </div>

                        {/* Work Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Work Email</label>
                            <input
                                {...register('email')}
                                placeholder="john@agency.com"
                                className="w-full h-12 bg-[#0A061D]/50 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-[#0A061D] transition-all"
                            />
                            {errors.email && <span className="text-xs text-rose-500 ml-1">{errors.email.message}</span>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full h-12 bg-[#0A061D]/50 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-[#0A061D] transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-xs text-rose-500 ml-1">{errors.password.message}</span>}

                            {/* Password Strength Indicator */}
                            {password && password.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4].map((level) => {
                                            const { strength } = calculatePasswordStrength(password);
                                            const isActive = level <= strength;
                                            const colors = {
                                                1: 'bg-rose-500',
                                                2: 'bg-amber-500',
                                                3: 'bg-blue-500',
                                                4: 'bg-emerald-500'
                                            };
                                            return (
                                                <div
                                                    key={level}
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${isActive ? colors[level as keyof typeof colors] : 'bg-white/10'
                                                        }`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-start gap-2 text-[10px]">
                                        <div className="flex-1 space-y-1">
                                            {Object.entries(calculatePasswordStrength(password)).map(([key, value]) => {
                                                if (key === 'strength') return null;
                                                const labels: Record<string, string> = {
                                                    hasLowercase: 'Lowercase',
                                                    hasUppercase: 'Uppercase',
                                                    hasNumber: 'Number',
                                                    hasMinLength: '8+ chars'
                                                };
                                                return (
                                                    <div key={key} className={`flex items-center gap-1.5 transition-colors ${value ? 'text-emerald-400' : 'text-slate-500'
                                                        }`}>
                                                        <div className={`w-1 h-1 rounded-full ${value ? 'bg-emerald-400' : 'bg-slate-500'
                                                            }`} />
                                                        {labels[key]}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-center gap-3 pt-2">
                            <div className="relative flex items-center">
                                <input type="checkbox" id="terms" className="peer w-5 h-5 appearance-none border border-white/20 rounded-md bg-[#0A061D]/50 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" />
                                <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                            </div>
                            <label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer select-none">
                                I accept the <Link href="#" className="text-indigo-400 hover:text-indigo-300">Terms</Link> and <Link href="#" className="text-indigo-400 hover:text-indigo-300">Agreement</Link>
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] transition-all transform active:scale-[0.98] mt-4"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'SIGN UP'}
                        </button>

                        <div className="text-center mt-6">
                            <span className="text-slate-500 text-sm">Already have an account? </span>
                            <Link href="/login" className="text-white font-bold hover:text-indigo-400 transition-colors">
                                Log In
                            </Link>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0A061D] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <SignUpContent />
        </Suspense>
    );
}
