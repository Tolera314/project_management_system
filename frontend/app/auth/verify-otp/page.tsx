'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { useToast } from '@/app/components/ui/Toast';

function VerifyOTPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const email = searchParams.get('email');
    const invitationToken = searchParams.get('invitation');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            router.push('/signup');
        }
    }, [email, router]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value)) && !/^[a-zA-Z]$/.test(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value.toUpperCase();
        setOtp(newOtp);

        // Move to next input if current field is filled
        if (element.value !== '' && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6).toUpperCase();
        if (data.length === 6) {
            const newOtp = data.split('');
            setOtp(newOtp);
            inputs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length !== 6) {
            showToast('error', 'Error', 'Please enter the full 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
                email,
                otpCode: fullOtp
            });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            setIsVerified(true);

            // Handle invitation auto-accept if token exists
            if (invitationToken) {
                try {
                    await axios.post(`${API_BASE_URL}/invitations/accept/${invitationToken}`, {}, {
                        headers: { 'Authorization': `Bearer ${res.data.token}` }
                    });
                } catch (err) {
                    console.error('Failed to auto-accept invitation:', err);
                }
            }

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err: any) {
            showToast('error', 'Verification Failed', err.response?.data?.error || 'Invalid code');
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/resend-otp`, { email });
            showToast('success', 'Code Sent', 'A new verification code has been sent to your email');
        } catch (err: any) {
            showToast('error', 'Error', 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A061D] p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Verified!</h2>
                    <p className="text-slate-400">Welcome to ProjectOS. Taking you to your dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#0A061D] selection:bg-indigo-500/30">
            {/* Simple Professional Backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full flex items-center justify-center p-6 z-10">
                <div className="w-full max-w-[500px] bg-[#151232] rounded-[32px] p-10 border border-white/5 shadow-2xl relative">
                    <Link
                        href="/signup"
                        className="absolute left-8 top-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Link>

                    <div className="text-center mt-8 mb-10">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                            <ShieldCheck className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Verification</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            We've sent a 6-digit code to <br />
                            <span className="text-indigo-300 font-semibold">{email}</span>
                        </p>
                    </div>

                    <div className="flex justify-between gap-2.5 mb-10">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                ref={(el) => { inputs.current[index] = el; }}
                                value={data}
                                onPaste={handlePaste}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-full h-14 bg-[#0A061D]/50 border-2 border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500 focus:bg-[#0A061D] transition-all"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isLoading}
                        className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'VERIFY ACCOUNT'}
                    </button>

                    <div className="text-center mt-10 space-y-4">
                        <p className="text-slate-500 text-sm">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="flex items-center gap-2 mx-auto text-indigo-400 font-bold hover:text-indigo-300 transition-colors disabled:opacity-50"
                        >
                            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw size={16} />}
                            Resend Code
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0A061D] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <VerifyOTPContent />
        </Suspense>
    );
}
