'use client';

import { useState, useEffect } from 'react';
import { Camera, Mail, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { FileService } from '../../services/file.service';
import UserAvatar from '../../components/shared/UserAvatar';

export default function ProfileSettingsPage() {
    const { updateUser } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        avatarUrl: ''
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    avatarUrl: data.avatarUrl || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File size must be less than 2MB' });
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        try {
            const data = await FileService.uploadFile(file, 'profile-avatars');
            // Store the full URL returned by server (Cloudinary)
            const newUrl = data.file?.url || data.url;
            setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload image' });
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    avatarUrl: profile.avatarUrl
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                // Update local storage user data if needed
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const updatedUser = { ...user, ...data.user };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    updateUser(data.user);
                }
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-xl font-bold text-white">Public Profile</h2>
                <p className="text-sm text-slate-400 mt-1">Control how you're appearing to others in workspaces.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="relative group">
                        <UserAvatar
                            firstName={profile.firstName}
                            avatarUrl={previewUrl || profile.avatarUrl}
                            size="xl"
                            className="border-4 border-slate-900 shadow-2xl"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white cursor-pointer">
                            <Camera size={20} />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="font-bold text-white">Profile Photo</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">Click the photo to upload a new one. JPG or PNG allowed. Max size 2MB.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">First Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Last Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="email"
                            value={profile.email}
                            readOnly
                            className="w-full bg-slate-800/30 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 italic">Email management is handled by your system administrator.</p>
                </div>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}
                        >
                            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSaving ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
