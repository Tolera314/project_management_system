'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, ShieldCheck, Clock, UserPlus, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InvitePage() {
    const { token } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(true);
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            verifyToken();
        }
    }, [token]);

    const verifyToken = async () => {
        try {
            setVerifying(true);
            const res = await fetch(`http://localhost:4000/invitations/verify/${token}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to verify invitation');
            }

            setInvitation(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    };

    const handleAccept = (action: 'login' | 'signup') => {
        if (action === 'login') {
            router.push(`/login?invitation=${token}&email=${encodeURIComponent(invitation.email)}`);
        } else {
            router.push(`/signup?invitation=${token}&email=${encodeURIComponent(invitation.email)}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-[#0A0A0A] border border-red-500/20 rounded-3xl p-8 text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Invitation Error</h1>
                        <p className="text-text-secondary">{error}</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 font-medium"
                    >
                        Back to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                <div className="p-8 md:p-12 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center ring-1 ring-primary/20">
                            {invitation.type === 'WORKSPACE' ? (
                                <ShieldCheck className="text-primary" size={40} />
                            ) : (
                                <Mail className="text-primary" size={40} />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                You're Invited!
                            </h1>
                            <p className="text-text-secondary text-lg max-w-sm">
                                <span className="text-white font-medium">{invitation.inviterName}</span> has invited you to join <span className="text-primary font-bold">{invitation.resourceName}</span>
                            </p>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary flex items-center gap-2">
                                <UserPlus size={16} />
                                Assigned Role
                            </span>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-xs uppercase tracking-wider">
                                {invitation.roleName}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t border-white/5 pt-4">
                            <span className="text-text-secondary flex items-center gap-2">
                                <Clock size={16} />
                                Expires
                            </span>
                            <span className="text-white">
                                {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4 pt-4">
                        {invitation.requiresSignup ? (
                            <div className="space-y-4">
                                <button
                                    onClick={() => handleAccept('signup')}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 text-lg"
                                >
                                    <UserPlus size={22} />
                                    Create Account to Join
                                </button>
                                <p className="text-center text-sm text-text-secondary">
                                    Already have an account? {' '}
                                    <button onClick={() => handleAccept('login')} className="text-primary hover:underline font-medium">Log in</button>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    onClick={() => handleAccept('login')}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 text-lg"
                                >
                                    <LogIn size={22} />
                                    Login to Accept
                                </button>
                                <p className="text-center text-sm text-text-secondary">
                                    Invitation for <span className="text-white font-medium">{invitation.email}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Deco */}
                <div className="bg-primary/5 p-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em]">Powered by Project Management System</p>
                </div>
            </motion.div>
        </div>
    );
}
