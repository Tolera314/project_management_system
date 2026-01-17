
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Search,
    Plus,
    ChevronRight,
    Check,
    X,
    Lock,
    Copy,
    Trash2,
    Info,
    LayoutGrid,
    Calendar,
    Users,
    ClipboardList,
    FileText,
    MessageSquare,
    BarChart3,
    Settings
} from 'lucide-react';
import { AdminService } from '@/app/services/admin.service';

interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    _count: { members: number };
    permissions: Array<{ permissionId: string }>;
    updatedAt: string;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

export default function RolesPermissionsPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stagedPermissions, setStagedPermissions] = useState<string[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ name: '', description: '', organizationId: 'default-org-id' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData] = await Promise.all([
                AdminService.getRoles(),
                AdminService.getAllPermissions()
            ]);
            setRoles(rolesData);
            setPermissions(permsData);
            if (rolesData.length > 0) {
                setSelectedRole(rolesData[0]);
                setStagedPermissions(rolesData[0].permissions.map((p: any) => p.permissionId));
            }
        } catch (error) {
            console.error('Failed to load roles/permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
        setStagedPermissions(role.permissions.map((p: any) => p.permissionId));
    };

    const togglePermission = (permissionId: string) => {
        if (!selectedRole || (selectedRole.isSystem && selectedRole.name === 'SYSTEM_ADMIN')) return;

        setStagedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        try {
            setSaving(true);
            await AdminService.updateRolePermissions(selectedRole.id, stagedPermissions);
            // Refresh local state
            setRoles(prev => prev.map(r =>
                r.id === selectedRole.id
                    ? { ...r, permissions: stagedPermissions.map(pId => ({ permissionId: pId })) }
                    : r
            ));
        } catch (error) {
            console.error('Failed to update permissions:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateRole = async () => {
        try {
            const created = await AdminService.createRole(newRoleData);
            setRoles([...roles, { ...created, _count: { members: 0 }, permissions: [] }]);
            setIsCreateModalOpen(false);
            setNewRoleData({ name: '', description: '', organizationId: 'default-org-id' });
        } catch (error) {
            console.error('Failed to create role:', error);
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'workspace': return <LayoutGrid className="w-4 h-4" />;
            case 'project': return <ClipboardList className="w-4 h-4" />;
            case 'task': return <Check className="w-4 h-4" />;
            case 'files': return <FileText className="w-4 h-4" />;
            case 'comments': return <MessageSquare className="w-4 h-4" />;
            case 'reports': return <BarChart3 className="w-4 h-4" />;
            default: return <Shield className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-text-secondary">Loading system roles...</p>
                </div>
            </div>
        );
    }

    const isSystemAdminRole = selectedRole?.isSystem && selectedRole?.name === 'SYSTEM_ADMIN';
    const hasChanges = selectedRole && JSON.stringify(stagedPermissions.sort()) !== JSON.stringify(selectedRole.permissions.map(p => p.permissionId).sort());

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Roles Sidebar */}
            <div className="w-80 border-r border-border bg-foreground/[0.02] flex flex-col">
                <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            System Roles
                        </h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search roles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredRoles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => handleRoleSelect(role)}
                            className={`w-full text-left p-3 rounded-xl transition-all group relative ${selectedRole?.id === role.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'hover:bg-foreground/[0.04] text-text-secondary'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${selectedRole?.id === role.id ? 'text-white' : 'text-text-primary'}`}>
                                    {role.name}
                                </span>
                                {role.isSystem && (
                                    <Lock className={`w-3 h-3 ${selectedRole?.id === role.id ? 'text-white/70' : 'text-text-secondary'}`} />
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] opacity-80">
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {role._count.members} users
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(role.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            {selectedRole?.id === role.id && (
                                <motion.div
                                    layoutId="active-role"
                                    className="absolute inset-0 rounded-xl ring-2 ring-primary ring-inset"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Permission Matrix Area */}
            <div className="flex-1 flex flex-col bg-background">
                {selectedRole ? (
                    <>
                        <div className="p-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold">{selectedRole.name}</h1>
                                        {selectedRole.isSystem && (
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-foreground/10 text-text-secondary">
                                                System Core
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-secondary text-sm">
                                        {selectedRole.description || 'Global role for managing system-wide permissions.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!selectedRole.isSystem && (
                                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-foreground/[0.02] transition-all">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                            Deprecate
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={!hasChanges || saving || isSystemAdminRole}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${hasChanges && !isSystemAdminRole
                                                ? 'bg-primary text-white shadow-primary/25 hover:scale-[1.02] active:scale-95'
                                                : 'bg-foreground/10 text-text-secondary cursor-not-allowed'
                                            }`}
                                    >
                                        {saving ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        Save Matrix
                                    </button>
                                </div>
                            </div>

                            {isSystemAdminRole && (
                                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                    <p className="text-sm text-amber-800 dark:text-amber-400">
                                        Core System Admin role cannot be modified. It always includes all available permissions.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                            <div className="max-w-4xl space-y-8">
                                {Object.entries(permissions).map(([category, items]) => (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-2 text-text-primary px-1">
                                            {getCategoryIcon(category)}
                                            <h3 className="font-bold uppercase tracking-widest text-xs opacity-60">
                                                {category}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map((perm) => (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.id)}
                                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${stagedPermissions.includes(perm.id)
                                                            ? 'border-primary/30 bg-primary/[0.03]'
                                                            : 'border-border bg-foreground/[0.01] hover:border-primary/20 hover:bg-foreground/[0.02]'
                                                        } ${isSystemAdminRole ? 'cursor-default opacity-80' : ''}`}
                                                >
                                                    <div className="space-y-1 pr-4">
                                                        <span className="text-sm font-semibold truncate block">
                                                            {perm.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                        </span>
                                                        <p className="text-[11px] text-text-secondary line-clamp-2">
                                                            {perm.description || 'No description provided.'}
                                                        </p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${stagedPermissions.includes(perm.id)
                                                            ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20'
                                                            : 'bg-foreground/10 text-transparent group-hover:bg-foreground/20'
                                                        }`}>
                                                        <Check className="w-4 h-4 stroke-[3px]" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-60">
                        <Shield className="w-16 h-16 mb-4 stroke-1" />
                        <p>Select a role to manage its permission matrix</p>
                    </div>
                )}
            </div>

            {/* Create Role Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden border border-border"
                        >
                            <div className="p-6 border-b border-border">
                                <h3 className="text-xl font-bold">Create New Global Role</h3>
                                <p className="text-sm text-text-secondary mt-1">Specify role details to begin configuration.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm flex items-center gap-2 text-text-primary px-1 font-bold italic opacity-70">
                                        Role Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Project Manager"
                                        value={newRoleData.name}
                                        onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-foreground/[0.03] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm flex items-center gap-2 text-text-primary px-1 font-bold italic opacity-70">
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Briefly describe the purpose of this role..."
                                        rows={3}
                                        value={newRoleData.description}
                                        onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-foreground/[0.03] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-foreground/[0.02] border-t border-border flex items-center gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-text-secondary hover:bg-foreground/10 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateRole}
                                    disabled={!newRoleData.name}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-lg ${newRoleData.name
                                            ? 'bg-primary text-white shadow-primary/25 hover:scale-[1.02] active:scale-95'
                                            : 'bg-foreground/10 text-text-secondary cursor-not-allowed'
                                        }`}
                                >
                                    Create Role
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

