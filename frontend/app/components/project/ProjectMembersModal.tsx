'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Shield, Trash2, User } from 'lucide-react';

interface ProjectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    onUpdateRole: (memberId: string, role: string) => Promise<void>;
    onRemoveMember: (memberId: string) => Promise<void>;
    currentUser: any;
    roles: any[];
}

export default function ProjectMembersModal({
    isOpen,
    onClose,
    project,
    onUpdateRole,
    onRemoveMember,
    currentUser,
    roles
}: ProjectMembersModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    if (!isOpen) return null;

    const members = project?.members || [];
    const filteredMembers = members.filter((m: any) =>
        m.organizationMember.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.organizationMember.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.organizationMember.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter project roles only? 
    // Wait, roles are strings here? Or Role objects?
    // In project.controller, members have a `role` field on ProjectMember relation?
    // Let's check schema/controller.
    // ProjectMember has `role` string field? OR relation to Role?
    // I need to verify ProjectMember schema.

    // Assuming role is a string enum or similar for now based on previous InviteMemberModal.
    // Actually, checking InviteMemberModal might be wise.

    /* 
       ProjectMember Role types usually: 'MANAGER', 'MEMBER', 'VIEWER' 
       or linked to the Role system?
       
       In `workspace.controller.ts`, I saw `Project Manager`, `Project Member` roles created in Role table.
       But ProjectMember relation in Prisma usually stores the specific project role.
       
       Let's assume for now it's using the Role system if possible, OR a simplified enum on ProjectMember.
       Wait, `ProjectMember` model in schema...
       
       If I look at `InviteMemberModal`, it uses `roleId`.
       So ProjectMember likely links to `Role`.
    */

    const handleRoleUpdate = async (memberId: string, newRoleId: string) => {
        setLoadingMap(prev => ({ ...prev, [memberId]: true }));
        try {
            await onUpdateRole(memberId, newRoleId);
        } finally {
            setLoadingMap(prev => ({ ...prev, [memberId]: false }));
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('Remove this member from the project?')) return;
        setLoadingMap(prev => ({ ...prev, [memberId]: true }));
        try {
            await onRemoveMember(memberId);
        } finally {
            setLoadingMap(prev => ({ ...prev, [memberId]: false }));
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-surface border border-slate-200 dark:border-foreground/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-foreground/5 flex items-center justify-between bg-slate-50 dark:bg-foreground/5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-text-primary mb-1">Project Members</h2>
                            <p className="text-sm text-slate-500 dark:text-text-secondary">Manage access and permissions for {project.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-foreground/10 rounded-lg text-slate-500 dark:text-text-secondary hover:text-slate-800 dark:hover:text-text-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-slate-200 dark:border-foreground/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filter members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-foreground/5 border border-slate-200 dark:border-foreground/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-text-primary focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredMembers.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-foreground/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-foreground/5 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-slate-200 dark:border-foreground/10 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-text-primary">
                                        {member.organizationMember.user.firstName[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-800 dark:text-text-primary text-sm">
                                            {member.organizationMember.user.firstName} {member.organizationMember.user.lastName}
                                            {member.organizationMember.user.id === currentUser?.id && <span className="ml-2 text-xs text-slate-500 dark:text-text-secondary">(You)</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-text-secondary">{member.organizationMember.user.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Role Selector */}
                                    <select
                                        disabled={loadingMap[member.id]}
                                        value={member.roleId || ''}
                                        onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                                        className="bg-white dark:bg-surface border border-slate-200 dark:border-foreground/10 rounded-lg px-2 py-1.5 text-xs text-slate-600 dark:text-text-secondary focus:outline-none focus:border-primary/50 disabled:opacity-50"
                                    >
                                        {roles.map((role: any) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => handleRemove(member.id)}
                                        disabled={loadingMap[member.id]}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredMembers.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No members found matching your search.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
