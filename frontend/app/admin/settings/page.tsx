'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Settings, Globe, Shield, Braces } from 'lucide-react';

export default function SettingsAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">Platform Configuration</h1>
                <div className="divide-y divide-white/5 bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                    {[
                        { icon: Globe, label: 'Platform Branding', desc: 'Custom logos, primary colors, and landing page URLs.' },
                        { icon: Braces, label: 'API Configuration', desc: 'Manage public API keys and webhooks.' },
                        { icon: Shield, label: 'Compliance & GDPR', desc: 'Data retention policies and privacy settings.' },
                    ].map((item, i) => (
                        <button key={i} className="w-full flex items-center gap-6 p-6 hover:bg-white/[0.02] transition-colors text-left group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                <item.icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{item.label}</h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
