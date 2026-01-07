'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { History, Search, Filter } from 'lucide-react';

export default function LogsAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Activity & Audit Logs</h1>
                        <p className="text-slate-500 text-sm mt-1">Immutable record of every significant action taken across the platform.</p>
                    </div>
                </div>

                <div className="flex items-center justify-center p-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <div className="text-center space-y-3">
                        <History size={48} className="mx-auto text-slate-700" />
                        <p className="text-slate-500 font-medium">Log streaming engine initializing...</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
