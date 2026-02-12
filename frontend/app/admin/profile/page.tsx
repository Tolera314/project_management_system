'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { User, Shield, Key, Mail, Clock, LogOut, Camera, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth.service';

export default function AdminProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking user load from localStorage or auth service
        const userData = AuthService.getUser();
        setUser(userData);
        setLoading(false);
    }, []);

    if (loading) return <div className="p-8 text-text-secondary italic">Loading profile...</div>;

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Admin Profile</h1>
                    <p className="text-text-secondary text-sm mt-1">Manage your administrator account and security credentials.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                            <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 relative">
                                <div className="absolute -bottom-12 left-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-surface shadow-xl flex items-center justify-center overflow-hidden">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <button className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Camera size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-16 p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-text-primary capitalize">{user?.firstName} {user?.lastName}</h2>
                                        <p className="text-sm text-text-secondary flex items-center gap-2">
                                            <Shield size={14} className="text-primary" />
                                            {user?.systemRole || 'System Administrator'}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-success/10 text-success text-[10px] font-bold rounded-full uppercase tracking-widest border border-success/20">Active Session</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Email Address</label>
                                        <div className="flex items-center gap-3 p-3 bg-foreground/[0.03] border border-border rounded-2xl text-sm text-text-primary">
                                            <Mail size={16} className="text-text-secondary" />
                                            {user?.email}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Employee ID / Handle</label>
                                        <div className="flex items-center gap-3 p-3 bg-foreground/[0.03] border border-border rounded-2xl text-sm text-text-primary">
                                            <User size={16} className="text-text-secondary" />
                                            @{user?.firstName?.toLowerCase()}{user?.lastName?.toLowerCase() || 'admin'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-surface border border-border rounded-3xl p-8 space-y-6">
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={18} className="text-primary" />
                                Security & Authentication
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-foreground/[0.02] border border-border rounded-2xl">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 h-fit">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">Two-Factor Authentication (MFA)</p>
                                            <p className="text-xs text-text-secondary">Secures your account using an authenticator app.</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-foreground/[0.05] hover:bg-foreground/[0.1] text-text-primary text-xs font-bold rounded-xl transition-all">
                                        Enabled
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-foreground/[0.02] border border-border rounded-2xl">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-foreground/[0.05] rounded-xl text-text-secondary shrink-0 h-fit">
                                            <Key size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">Password</p>
                                            <p className="text-xs text-text-secondary">Last changed 45 days ago.</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-foreground/[0.05] hover:bg-foreground/[0.1] text-text-primary text-xs font-bold rounded-xl transition-all">
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Col: Session & Stats */}
                    <div className="space-y-6">
                        <section className="bg-surface border border-border rounded-3xl p-6">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">Recent Logins</h3>
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-border flex items-center justify-center shrink-0">
                                            <Clock size={16} className="text-text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-text-primary">Web Session (Chrome / Windows)</p>
                                            <p className="text-[10px] text-text-secondary mt-0.5">2 hours ago • 192.168.1.{10 + i}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-6 py-2.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                Revoke All Other Sessions
                            </button>
                        </section>

                        <div className="rounded-3xl bg-primary/5 border border-primary/10 p-6">
                            <div className="flex items-center gap-3 text-primary mb-4">
                                <AlertCircle size={20} />
                                <span className="font-bold text-sm">Pro Tip</span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Always ensure your session is closed before leaving the terminal. Multiple concurrent admin sessions may trigger an automated security audit.
                            </p>
                        </div>

                        <button
                            onClick={() => AuthService.logout()}
                            className="w-full py-4 bg-foreground/[0.03] hover:bg-danger hover:text-white border border-border rounded-3xl text-sm font-bold text-text-primary transition-all flex items-center justify-center gap-2 group"
                        >
                            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                            Sign Out of Platform
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
