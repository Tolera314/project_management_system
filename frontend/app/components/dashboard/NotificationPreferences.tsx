'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Info, Save, RotateCcw } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface Preference {
    taskAssignedInApp: boolean;
    taskAssignedEmail: boolean;
    taskStatusInApp: boolean;
    taskStatusEmail: boolean;
    taskCommentInApp: boolean;
    taskCommentEmail: boolean;
    taskDueInApp: boolean;
    taskDueEmail: boolean;
    projectMemberInApp: boolean;
    projectMemberEmail: boolean;
    projectRoleInApp: boolean;
    projectRoleEmail: boolean;
    milestoneInApp: boolean;
    milestoneEmail: boolean;
    invitationInApp: boolean;
    invitationEmail: boolean;
}

interface PreferenceItem {
    label: string;
    inApp: keyof Preference | null;
    email: keyof Preference | null;
    critical?: boolean;
    note?: string;
}

interface Section {
    title: string;
    desc: string;
    items: PreferenceItem[];
}

const sections: Section[] = [
    {
        title: 'Task Notifications',
        desc: 'Get notified about tasks assigned to you or changes to their status.',
        items: [
            { label: 'Task Assigned', inApp: 'taskAssignedInApp', email: 'taskAssignedEmail', critical: true },
            { label: 'Status Changes', inApp: 'taskStatusInApp', email: 'taskStatusEmail' },
            { label: 'New Comments', inApp: 'taskCommentInApp', email: 'taskCommentEmail' },
            { label: 'Due Dates', inApp: 'taskDueInApp', email: 'taskDueEmail' },
        ]
    },
    {
        title: 'Project Notifications',
        desc: 'Stay informed about project membership and role changes.',
        items: [
            { label: 'Added to Project', inApp: 'projectMemberInApp', email: 'projectMemberEmail' },
            { label: 'Role Changes', inApp: 'projectRoleInApp', email: 'projectRoleEmail' },
            { label: 'Milestone Updates', inApp: 'milestoneInApp', email: 'milestoneEmail' },
        ]
    },
    {
        title: 'System Notifications',
        desc: 'Important alerts about invitations and security.',
        items: [
            { label: 'Invitations', inApp: 'invitationInApp', email: 'invitationEmail' },
            { label: 'Security Alerts', inApp: null, email: null, critical: true, note: 'Always enabled via email' },
        ]
    }
];

const NotificationPreferences = () => {
    const { showToast } = useToast();
    const [prefs, setPrefs] = useState<Preference | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:4000/notifications/preferences', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.preference) {
                    setPrefs(data.preference);
                }
            } catch (error) {
                console.error('Failed to fetch preferences:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrefs();
    }, []);

    const handleToggle = (key: keyof Preference) => {
        if (!prefs) return;
        setPrefs({ ...prefs, [key]: !prefs[key] });
    };

    const handleSave = async () => {
        if (!prefs) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/notifications/preferences', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(prefs)
            });

            if (res.ok) {
                showToast('success', 'Preferences updated', 'Your notification settings have been saved.');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showToast('error', 'Update failed', 'Could not save your preferences.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-slate-800/50 rounded-xl" />
            ))}
        </div>;
    }

    if (!prefs) return null;

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                    <p className="text-sm text-slate-400 mt-1">Choose how you want to be notified about activity.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="space-y-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <div>
                            <h3 className="text-white font-semibold">{section.title}</h3>
                            <p className="text-xs text-slate-500">{section.desc}</p>
                        </div>

                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                            <div className="grid grid-cols-12 px-6 py-3 bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <div className="col-span-6">Activity</div>
                                <div className="col-span-3 text-center flex items-center justify-center gap-1">
                                    <Bell className="w-3 h-3" /> In-App
                                </div>
                                <div className="col-span-3 text-center flex items-center justify-center gap-1">
                                    <Mail className="w-3 h-3" /> Email
                                </div>
                            </div>

                            {section.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-12 px-6 py-4 items-center group hover:bg-white/[0.02] transition-colors">
                                    <div className="col-span-6">
                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                        {item.note && <p className="text-[10px] text-indigo-400 mt-0.5">{item.note}</p>}
                                    </div>
                                    <div className="col-span-3 flex justify-center">
                                        {item.inApp ? (
                                            <Toggle
                                                checked={(prefs as any)[item.inApp]}
                                                onChange={() => handleToggle(item.inApp as keyof Preference)}
                                                disabled={item.critical && (prefs as any)[item.inApp]}
                                            />
                                        ) : <span className="text-slate-700">—</span>}
                                    </div>
                                    <div className="col-span-3 flex justify-center">
                                        {item.email ? (
                                            <Toggle
                                                checked={(prefs as any)[item.email]}
                                                onChange={() => handleToggle(item.email as keyof Preference)}
                                                disabled={item.critical}
                                            />
                                        ) : (
                                            item.critical ? <div className="w-8 h-4 bg-indigo-500/20 rounded-full flex items-center justify-end px-1 opacity-50"><div className="w-2.5 h-2.5 bg-indigo-400 rounded-full" /></div> : <span className="text-slate-700">—</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <button
        onClick={onChange}
        disabled={disabled}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-indigo-500' : 'bg-slate-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div
            className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
                }`}
        />
    </button>
);

export default NotificationPreferences;
