'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Check, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '../shared/UserAvatar';

interface InlineAssigneeSelectorProps {
    currentAssignees: any[];
    projectMembers: any[];
    organizationMembers: any[];
    onAssign: (memberId: string) => void;
    onUnassign: (memberId: string) => void;
    onInvite?: (email: string) => void;
    invitations?: any[]; // Added invitations
    readOnly?: boolean;
}

export default function InlineAssigneeSelector({
    currentAssignees,
    projectMembers,
    organizationMembers,
    onAssign,
    onUnassign,
    onInvite,
    invitations = [],
    readOnly = false
}: InlineAssigneeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Rule: Include all project members, all space admins, and all pending invitations
    const allAssignable = [
        ...organizationMembers.map(orgMem => {
            const projectMember = projectMembers.find(pm => pm.organizationMemberId === orgMem.id);
            return {
                id: projectMember?.id || null,
                organizationMemberId: orgMem.id,
                user: orgMem.user,
                role: orgMem.role.name,
                projectRole: projectMember?.role?.name || (orgMem.role.name === 'Admin' ? 'Workspace Admin' : 'Workspace Member'),
                type: 'MEMBER'
            };
        }),
        ...invitations.map(inv => ({
            id: null,
            organizationMemberId: null,
            user: { firstName: inv.email.split('@')[0], lastName: '(Invited)', email: inv.email },
            role: 'Invited',
            projectRole: 'Pending Invitation',
            type: 'INVITATION'
        }))
    ];

    const filtered = allAssignable.filter(m => {
        const fullName = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) || m.user.email.toLowerCase().includes(search.toLowerCase());
    });

    const isAssigned = (userId: string) => currentAssignees.some(a => a.projectMember.organizationMember.userId === userId);

    const getInitials = (user: any) => {
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    };

    return (
        <div className="relative inline-flex items-center" ref={containerRef}>
            <div className="flex -space-x-2 overflow-hidden">
                {currentAssignees.map((assignee) => (
                    <div
                        key={assignee.id}
                        className="relative group rounded-full border-2 border-surface transition-transform hover:z-10 hover:scale-110"
                        title={`${assignee.projectMember.organizationMember.user.firstName} ${assignee.projectMember.organizationMember.user.lastName}`}
                    >
                        <UserAvatar
                            userId={assignee.projectMember.organizationMember.userId}
                            firstName={assignee.projectMember.organizationMember.user.firstName}
                            lastName={assignee.projectMember.organizationMember.user.lastName}
                            avatarUrl={assignee.projectMember.organizationMember.user.avatarUrl}
                            size="sm"
                            className="bg-gradient-to-br from-primary to-accent ring-1 ring-white/10 text-[8px]"
                        />
                        {!readOnly && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUnassign(assignee.projectMemberId);
                                }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X size={8} className="text-white" />
                            </button>
                        )}
                    </div>
                ))}

                {!readOnly && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="w-6 h-6 rounded-full border-2 border-surface bg-surface-secondary border-dashed border-border flex items-center justify-center hover:bg-surface hover:border-primary text-text-secondary hover:text-primary transition-all group"
                    >
                        <Plus size={12} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search members..."
                                    className="w-full bg-surface-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                            {filtered.length === 0 ? (
                                <div className="text-center py-8">
                                    <User size={24} className="mx-auto text-white/10 mb-2" />
                                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">No members found</p>
                                    {onInvite && search.includes('@') && (
                                        <button
                                            onClick={() => {
                                                onInvite(search);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className="mt-4 w-full p-3 bg-primary/10 hover:bg-primary/20 rounded-xl flex items-center gap-3 transition-all group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                                <Plus size={16} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-white">Invite & Assign</p>
                                                <p className="text-[10px] text-text-secondary truncate w-32">{search}</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filtered.map((member) => {
                                        const assigned = isAssigned(member.user.id);
                                        const uniqueId = member.type === 'INVITATION' ? `inv_${invitations.find(i => i.email === member.user.email)?.id}` : (member.id || `org_${member.organizationMemberId}`);

                                        return (
                                            <button
                                                key={member.type === 'INVITATION' ? member.user.email : member.organizationMemberId}
                                                onClick={() => {
                                                    if (assigned) {
                                                        const assignee = currentAssignees.find(a => a.projectMember.organizationMember.userId === member.user.id);
                                                        if (assignee) onUnassign(assignee.projectMemberId);
                                                    } else {
                                                        onAssign(uniqueId);
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${assigned ? 'bg-primary/10' : 'hover:bg-surface-secondary'}`}
                                            >
                                                <div className="relative">
                                                    <UserAvatar
                                                        userId={member.user.id}
                                                        firstName={member.user.firstName}
                                                        lastName={member.user.lastName}
                                                        avatarUrl={member.user.avatarUrl}
                                                        size="md"
                                                        className="bg-gradient-to-br from-slate-700 to-slate-800 ring-1 ring-white/10"
                                                    />
                                                    {assigned && (
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg border border-surface">
                                                            <Check size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-xs font-bold text-text-primary">{member.user.firstName} {member.user.lastName}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase tracking-tighter">{member.projectRole}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
