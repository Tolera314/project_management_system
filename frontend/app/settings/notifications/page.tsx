'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Settings } from 'lucide-react';
import NotificationPreferences from '../../components/dashboard/NotificationPreferences';

export default function NotificationSettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Bell className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Notifications</h2>
                </div>
                <p className="text-sm text-slate-400">Manage how you receive updates and stay connected with your team.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <NotificationPreferences />
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-2 text-white font-semibold mb-3">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-sm">Privacy & Security</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Security alerts and direct task assignments are considered critical.
                            We'll always send these via email to ensure you don't miss important updates.
                        </p>
                    </div>

                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-3">
                            <Settings className="w-4 h-4" />
                            <h3 className="text-sm">Pro Tip</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            You can also manage project-specific notifications from each project's settings menu.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
