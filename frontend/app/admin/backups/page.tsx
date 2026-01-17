'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { Database, CloudUpload, History } from 'lucide-react';

export default function BackupsAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">Data Integrity & Backups</h1>

                <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Database size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Status: Protected</p>
                            <h2 className="text-xl font-bold text-white">Last backup: 14 minutes ago</h2>
                            <p className="text-sm text-slate-500">Auto-backup schedule is active (Daily at 03:00 UTC)</p>
                        </div>
                    </div>
                    <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10">
                        Trigger Manual Backup
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
