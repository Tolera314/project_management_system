'use client';

import AdminLayout from '../../components/admin/AdminLayout';
import { BarChart3 } from 'lucide-react';

export default function ReportsAdmin() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">Platform Reports & Analytics</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
