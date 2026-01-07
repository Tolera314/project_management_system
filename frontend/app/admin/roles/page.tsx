'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function RolesAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Roles & Permissions</h1>
                    <p className="text-slate-500 text-sm mt-1">Define platform-wide role blueprints and granular permission sets.</p>
                </div>

                <div className="p-12 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">RBAC Configuration</h2>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                            This module allows you to define the absolute permissions for Workspace Admins, PMs, and Members globally.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
