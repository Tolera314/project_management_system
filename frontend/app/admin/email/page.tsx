'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Mail, MessageSquare, Bell, Zap } from 'lucide-react';

export default function EmailAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Email & Notification Relay</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage transactional mail flow and Brevo API integration.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <Mail className="text-primary mb-4" />
                        <h3 className="font-bold text-white mb-2">SMTP Relay</h3>
                        <p className="text-xs text-slate-500">brevo-relay.io:587</p>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
