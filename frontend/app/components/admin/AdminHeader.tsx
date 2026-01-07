'use client';

import { Search, Bell, User, LogOut, Shield, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminHeader() {
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    return (
        <header className="h-16 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search users, workspaces, or audit logs..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020617]" />
                </button>

                <div className="h-8 w-[1px] bg-white/5 mx-2" />

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 p-1 rounded-full border border-white/10 hover:border-primary/50 transition-all bg-white/5"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                            MA
                        </div>
                    </button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-3 w-56 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden py-1"
                            >
                                <div className="px-4 py-3 border-b border-white/5">
                                    <p className="text-sm font-bold text-white">Master Admin</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">System Superuser</p>
                                </div>
                                <div className="p-1">
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                        <User size={16} />
                                        Profile
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                        <Shield size={16} />
                                        Security
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                        <SettingsIcon size={16} />
                                        Platform Settings
                                    </button>
                                </div>
                                <div className="p-1 border-t border-white/5">
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-white hover:bg-red-500 transition-all">
                                        <LogOut size={16} />
                                        Sign out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
