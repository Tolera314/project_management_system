'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function AppearanceSettingsPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const themes = [
        {
            id: 'light',
            name: 'Light',
            icon: Sun,
            description: 'Clean and bright, easy on the eyes in well-lit environments.',
            preview: 'bg-white border-slate-200'
        },
        {
            id: 'dark',
            name: 'Dark',
            icon: Moon,
            description: 'Reduced eye strain in low-light conditions with deep navy tones.',
            preview: 'bg-[#020617] border-white/10'
        },
        {
            id: 'system',
            name: 'System',
            icon: Monitor,
            description: 'Automatically switch between light and dark themes based on system settings.',
            preview: 'bg-gradient-to-br from-white to-[#020617] border-slate-300'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Appearance & Theme</h2>
                </div>
                <p className="text-sm text-slate-400">Customize how ProjectOS looks and feels on your device.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {themes.map((t) => {
                    const isActive = theme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`group relative flex flex-col p-4 rounded-2xl border transition-all text-left ${isActive
                                ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className={`w-full aspect-[4/3] rounded-xl mb-4 border ${t.preview} overflow-hidden shadow-inner`}>
                                <div className="p-2 space-y-1.5 opacity-40">
                                    <div className={`h-2 w-2/3 rounded-full ${t.id === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`} />
                                    <div className={`h-2 w-full rounded-full ${t.id === 'light' ? 'bg-slate-100' : 'bg-slate-900'}`} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <t.icon size={16} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                    <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                        {t.name}
                                    </span>
                                </div>
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-primary p-1 rounded-full text-white"
                                    >
                                        <Check size={10} strokeWidth={4} />
                                    </motion.div>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                {t.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl">
                <h3 className="font-semibold text-white mb-4">Display Accent</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-not-allowed opacity-60">
                        <div className="w-4 h-4 rounded-full bg-indigo-500" />
                        <span className="text-xs font-medium text-slate-300">Default Indigo</span>
                        <div className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Active</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl border border-white/5 cursor-not-allowed opacity-40 transition-colors">
                        <div className="w-4 h-4 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-slate-400">Emerald Pine</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl border border-white/5 cursor-not-allowed opacity-40 transition-colors">
                        <div className="w-4 h-4 rounded-full bg-rose-500" />
                        <span className="text-xs font-medium text-slate-400">Rose Bloom</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl border border-white/5 cursor-not-allowed opacity-40 transition-colors">
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-slate-400">Amber Glow</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-600 mt-4 italic">Custom accent colors are coming soon in a future update.</p>
            </div>
        </div>
    );
}
