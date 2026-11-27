'use client';

import AdminLayout from '../../../components/admin/AdminLayout';
import { Settings, Shield, Zap, Info, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ProvisioningSettings() {
    const [settings, setSettings] = useState({
        allowSelfService: true,
        defaultPlan: 'FREE',
        maxStorageGB: 5,
        maxUsersPerWorkspace: 10,
        enableAutoProvisioning: false,
        requiresApproval: true
    });

    const handleSave = () => {
        // Mock save logic
        alert("Provisioning settings saved successfully.");
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Provisioning Configuration</h1>
                    <p className="text-text-secondary text-sm mt-1">Define global rules for workspace creation and resource allocation.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Core Rules */}
                        <div className="bg-surface border border-border rounded-3xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-foreground/[0.02]">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={16} className="text-primary" />
                                    Deployment Rules
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">Allow Self-Service Creation</p>
                                        <p className="text-xs text-text-secondary">Users can create new workspaces without admin intervention.</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, allowSelfService: !settings.allowSelfService })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${settings.allowSelfService ? 'bg-primary' : 'bg-border'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allowSelfService ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-text-primary">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">Workspace Approval Flow</p>
                                        <p className="text-xs text-text-secondary">Flag all new self-service workspaces for manual review.</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, requiresApproval: !settings.requiresApproval })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${settings.requiresApproval ? 'bg-primary' : 'bg-border'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.requiresApproval ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="h-px bg-border" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Default New Workspace Plan</label>
                                        <select
                                            value={settings.defaultPlan}
                                            onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
                                            className="w-full bg-foreground/[0.03] border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="FREE">Free Tier</option>
                                            <option value="BUSINESS">Business</option>
                                            <option value="ENTERPRISE">Enterprise</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Max Users per Workspace</label>
                                        <input
                                            type="number"
                                            value={settings.maxUsersPerWorkspace}
                                            onChange={(e) => setSettings({ ...settings, maxUsersPerWorkspace: parseInt(e.target.value) })}
                                            className="w-full bg-foreground/[0.03] border border-border rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quota Management */}
                        <div className="bg-surface border border-border rounded-3xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-foreground/[0.02]">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" />
                                    Resource Quotas
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-bold text-text-primary">Default Storage Limit</span>
                                        <span className="text-sm font-mono text-primary">{settings.maxStorageGB} GB</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={settings.maxStorageGB}
                                        onChange={(e) => setSettings({ ...settings, maxStorageGB: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-foreground/[0.05] rounded-full appearance-none cursor-pointer accent-primary"
                                    />
                                    <p className="text-[10px] text-text-secondary mt-2">Maximum file storage allocated to new organizations by default.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Info card */}
                        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                                <Info size={20} />
                            </div>
                            <h3 className="font-bold text-text-primary mb-2">Provisioning Logic</h3>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Changes made here will affect all **new** workspaces created after the settings are saved.
                                To apply quotas to existing workspaces, use the Workspace Management bulk actions.
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={handleSave}
                                    className="w-full py-3 bg-primary text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                                <button className="w-full py-3 bg-foreground/[0.03] text-text-primary border border-border rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-foreground/[0.05] transition-all">
                                    <RotateCcw size={18} />
                                    Reset to System Defaults
                                </button>
                            </div>
                        </div>

                        {/* Notice Card */}
                        <div className="bg-warning/5 border border-warning/10 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-warning mb-2 uppercase tracking-widest">Enterprise Notice</h3>
                            <p className="text-xs text-text-secondary">
                                Organizations on **Enterprise** plans can bypass these global quotas. Check plan-specific overrides in the Plans & Billing section.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
