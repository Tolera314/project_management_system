'use client';

import { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, Database, Mail, Shield, Settings as SettingsIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import { API_BASE_URL } from '../../config/api.config';

type SettingsTab = 'general' | 'security' | 'backups' | 'email';

interface SystemSettings {
    [key: string]: any;
}

interface Backup {
    id: string;
    filename: string;
    sizeBytes: number;
    status: string;
    createdAt: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [settings, setSettings] = useState<SystemSettings>({});
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [pendingSave, setPendingSave] = useState<{ group: string, settings: SystemSettings } | null>(null);

    useEffect(() => {
        fetchSettings();
        if (activeTab === 'backups') {
            fetchBackups();
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const fetchBackups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBackups(data);
            }
        } catch (error) {
            console.error('Failed to fetch backups', error);
        }
    };

    const saveSettings = async (group: string, updatedSettings: SystemSettings) => {
        setSaveStatus('saving');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ group, settings: updatedSettings })
            });

            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('Failed to save settings', error);
            setSaveStatus('error');
        }
    };

    const triggerBackup = async () => {
        setIsBackupModalOpen(false);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings/backup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchBackups();
            }
        } catch (error) {
            console.error('Backup failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWithConfirm = (group: string, updatedSettings: SystemSettings) => {
        if (group === 'SECURITY' || group === 'EMAIL') {
            setPendingSave({ group, settings: updatedSettings });
            setIsSaveModalOpen(true);
        } else {
            saveSettings(group, updatedSettings);
        }
    };

    const executePendingSave = () => {
        if (pendingSave) {
            saveSettings(pendingSave.group, pendingSave.settings);
            setPendingSave(null);
            setIsSaveModalOpen(false);
        }
    };

    const sendTestEmail = async () => {
        const email = prompt('Enter test email address:');
        if (!email) return;

        setTestEmailStatus('sending');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings/test-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setTestEmailStatus('success');
                setTimeout(() => setTestEmailStatus('idle'), 3000);
            } else {
                setTestEmailStatus('error');
            }
        } catch (error) {
            console.error('Test email failed', error);
            setTestEmailStatus('error');
        }
    };

    const tabs = [
        { id: 'general' as SettingsTab, label: 'General', icon: SettingsIcon },
        { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
        { id: 'backups' as SettingsTab, label: 'Backups & Data', icon: Database },
        { id: 'email' as SettingsTab, label: 'Email & Notifications', icon: Mail },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">System Settings</h1>
                    <p className="text-text-secondary mt-2">Configure global platform behavior and security</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <div className="flex gap-4">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    {activeTab === 'general' && <GeneralTab settings={settings} onSave={saveSettings} saveStatus={saveStatus} />}
                    {activeTab === 'security' && <SecurityTab settings={settings} onSave={handleSaveWithConfirm} saveStatus={saveStatus} />}
                    {activeTab === 'backups' && <BackupsTab backups={backups} onTriggerBackup={() => setIsBackupModalOpen(true)} loading={loading} />}
                    {activeTab === 'email' && <EmailTab settings={settings} onSave={handleSaveWithConfirm} sendTest={sendTestEmail} saveStatus={saveStatus} testEmailStatus={testEmailStatus} />}
                </div>

                <ConfirmationModal
                    isOpen={isBackupModalOpen}
                    onClose={() => setIsBackupModalOpen(false)}
                    onConfirm={triggerBackup}
                    title="Trigger Database Backup?"
                    message="This will create a full snapshot of the current database. Large databases may take a few minutes to process."
                    confirmText="Create Backup"
                    isLoading={loading}
                />

                <ConfirmationModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onConfirm={executePendingSave}
                    title="Save Critical Settings?"
                    message="You are about to modify sensitive system settings (Security or Email). Incorrect configuration could affect platform access or communications."
                    confirmText="Save Changes"
                    variant="warning"
                />
            </div>
        </AdminLayout>
    );
}

function GeneralTab({ settings, onSave, saveStatus }: { settings: SystemSettings; onSave: (group: string, settings: SystemSettings) => void; saveStatus: string }) {
    const [formData, setFormData] = useState({
        platformName: settings['platformName'] || 'ProjectOS',
        timezone: settings['timezone'] || 'UTC',
        dateFormat: settings['dateFormat'] || 'YYYY-MM-DD',
    });

    const handleSave = () => {
        onSave('GENERAL', formData);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Platform Name</label>
                <input
                    type="text"
                    value={formData.platformName}
                    onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Default Timezone</label>
                <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Date Format</label>
                <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
            </div>

            <SaveButton onClick={handleSave} status={saveStatus} />
        </div>
    );
}

function SecurityTab({ settings, onSave, saveStatus }: { settings: SystemSettings; onSave: (group: string, settings: SystemSettings) => void; saveStatus: string }) {
    const [formData, setFormData] = useState({
        mfaEnabled: settings['mfaEnabled'] || false,
        sessionTimeout: settings['sessionTimeout'] || '30',
        passwordExpiry: settings['passwordExpiry'] || '90',
    });

    const handleSave = () => {
        onSave('SECURITY', formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div>
                    <p className="font-medium text-text-primary">Enforce Multi-Factor Authentication</p>
                    <p className="text-sm text-text-secondary">Require all users to enable MFA</p>
                </div>
                <input
                    type="checkbox"
                    checked={formData.mfaEnabled}
                    onChange={(e) => setFormData({ ...formData, mfaEnabled: e.target.checked })}
                    className="w-5 h-5"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Session Timeout (minutes)</label>
                <input
                    type="number"
                    value={formData.sessionTimeout}
                    onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Password Expiry (days)</label>
                <input
                    type="number"
                    value={formData.passwordExpiry}
                    onChange={(e) => setFormData({ ...formData, passwordExpiry: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <SaveButton onClick={handleSave} status={saveStatus} />
        </div>
    );
}

function BackupsTab({ backups, onTriggerBackup, loading }: { backups: Backup[]; onTriggerBackup: () => void; loading: boolean }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Database Backups</h3>
                    <p className="text-sm text-text-secondary">Automated backups run daily at 2:00 AM UTC</p>
                </div>
                <button
                    onClick={onTriggerBackup}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    <Database size={18} />
                    {loading ? 'Creating...' : 'Backup Now'}
                </button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-surface-secondary">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-primary">Filename</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-primary">Size</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-primary">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-text-primary">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.map(backup => (
                            <tr key={backup.id} className="border-t border-border">
                                <td className="px-4 py-3 text-sm text-text-primary">{backup.filename}</td>
                                <td className="px-4 py-3 text-sm text-text-secondary">
                                    {(Number(backup.sizeBytes) / 1024 / 1024).toFixed(2)} MB
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${backup.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                                        }`}>
                                        {backup.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-text-secondary">
                                    {new Date(backup.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EmailTab({ settings, onSave, sendTest, saveStatus, testEmailStatus }: {
    settings: SystemSettings;
    onSave: (group: string, settings: SystemSettings) => void;
    sendTest: () => void;
    saveStatus: string;
    testEmailStatus: string;
}) {
    const [formData, setFormData] = useState({
        SMTP_SERVER: settings['SMTP_SERVER'] || '',
        SMTP_PORT: settings['SMTP_PORT'] || '587',
        SMTP_USER: settings['SMTP_USER'] || '',
        SMTP_PASS: settings['SMTP_PASS'] || '',
        SENDER_NAME: settings['SENDER_NAME'] || 'ProjectOS',
        SENDER_EMAIL: settings['SENDER_EMAIL'] || '',
    });

    const handleSave = () => {
        onSave('EMAIL', formData);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">SMTP Server</label>
                <input
                    type="text"
                    value={formData.SMTP_SERVER}
                    onChange={(e) => setFormData({ ...formData, SMTP_SERVER: e.target.value })}
                    placeholder="smtp.example.com"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">SMTP Port</label>
                    <input
                        type="text"
                        value={formData.SMTP_PORT}
                        onChange={(e) => setFormData({ ...formData, SMTP_PORT: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">SMTP Username</label>
                    <input
                        type="text"
                        value={formData.SMTP_USER}
                        onChange={(e) => setFormData({ ...formData, SMTP_USER: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">SMTP Password</label>
                <input
                    type="password"
                    value={formData.SMTP_PASS}
                    onChange={(e) => setFormData({ ...formData, SMTP_PASS: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Sender Name</label>
                    <input
                        type="text"
                        value={formData.SENDER_NAME}
                        onChange={(e) => setFormData({ ...formData, SENDER_NAME: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Sender Email</label>
                    <input
                        type="email"
                        value={formData.SENDER_EMAIL}
                        onChange={(e) => setFormData({ ...formData, SENDER_EMAIL: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <SaveButton onClick={handleSave} status={saveStatus} />
                <button
                    onClick={sendTest}
                    disabled={testEmailStatus === 'sending'}
                    className={`flex items-center gap-2 px-4 py-2 border border-border rounded-lg transition-colors ${testEmailStatus === 'success' ? 'bg-green-500/10 text-green-600 border-green-500' :
                        testEmailStatus === 'error' ? 'bg-red-500/10 text-red-600 border-red-500' :
                            'hover:bg-surface-secondary'
                        }`}
                >
                    <Mail size={18} />
                    {testEmailStatus === 'sending' ? 'Sending...' : testEmailStatus === 'success' ? 'Sent!' : 'Send Test Email'}
                </button>
            </div>
        </div>
    );
}

function SaveButton({ onClick, status }: { onClick: () => void; status: string }) {
    return (
        <button
            onClick={onClick}
            disabled={status === 'saving'}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${status === 'success'
                ? 'bg-green-500 text-white'
                : status === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
        >
            {status === 'success' ? (
                <>
                    <CheckCircle size={18} />
                    Saved!
                </>
            ) : status === 'error' ? (
                <>
                    <AlertTriangle size={18} />
                    Failed
                </>
            ) : (
                <>
                    <Save size={18} />
                    {status === 'saving' ? 'Saving...' : 'Save Changes'}
                </>
            )}
        </button>
    );
}
