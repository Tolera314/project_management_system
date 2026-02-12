'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Lock, ShieldAlert, Key, Globe } from 'lucide-react';

export default function SecurityAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8 max-w-5xl">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Security Center</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure global authentication, encryption, and access policies.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="text-emerald-500" />
                            <h3 className="font-bold text-white">System Posture</h3>
                        </div>
                        <p className="text-3xl font-bold text-emerald-500">EXCELLENT</p>
                        <p className="text-xs text-slate-500 mt-2">All security modules are operating within defined parameters.</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/50 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 mb-4">
                            <Key className="text-primary" />
                            <h3 className="font-bold text-white">SSO & OAuth</h3>
                        </div>
                        <p className="text-sm text-slate-400">Configure Google, GitHub, and SAML providers for the platform.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
