'use client';

import { User, Bell, Palette, Shield, Building2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const settingsNavItems = [
    { icon: User, label: 'Public Profile', href: '/settings/profile' },
    { icon: Bell, label: 'Notifications', href: '/settings/notifications' },
    { icon: Palette, label: 'Appearance & Theme', href: '/settings/appearance' },
    { icon: Shield, label: 'Account Security', href: '/settings/security' },
    { icon: Building2, label: 'Workspace Settings', href: '/settings/workspace' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl  text-slate-500 font-bold tracking-tight">Settings</h1>
                    <p className="text-slate-400 mt-2">Manage your account, preferences, and workspace environments.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Settings Sidebar */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                            {settingsNavItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap lg:whitespace-normal ${isActive
                                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <item.icon size={18} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Settings Area */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
