'use client';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-primary/30">
            <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
                <AdminHeader />

                <main className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
