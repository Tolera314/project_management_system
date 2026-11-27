'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '../shared/UserAvatar';

interface AssigneeSelectorProps {
    currentAssignees: any[];
    projectMembers: any[];
    onAssign: (memberId: string) => void;
    onUnassign: (memberId: string) => void;
    onInvite?: (email: string) => void;
    readOnly?: boolean;
}

export default function AssigneeSelector({ currentAssignees, projectMembers, onAssign, onUnassign, onInvite, readOnly = false }: AssigneeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredMembers = projectMembers.filter(member => {
        const name = `${member.organizationMember.user.firstName} ${member.organizationMember.user.lastName}`.toLowerCase();
        const role = member.role.name.toLowerCase();
        return name.includes(search.toLowerCase()) || role.includes(search.toLowerCase());
    });

    const isAssigned = (memberId: string) => currentAssignees.some(a => a.projectMemberId === memberId);

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 items-center">
                {currentAssignees.map((assignee) => (
                    <div key={assignee.id} className="group relative">
                        <UserAvatar
                            userId={assignee.projectMember.organizationMember.userId} // Assuming structure matches
                            firstName={assignee.projectMember.organizationMember.user.firstName}
                            lastName={assignee.projectMember.organizationMember.user.lastName}
                            avatarUrl={assignee.projectMember.organizationMember.user.avatarUrl}
                            size="sm"
                            className="bg-gradient-to-br from-primary to-purple-600 border border-white/10"
                        />
                        {!readOnly && (
                            <button
                                onClick={() => onUnassign(assignee.projectMemberId)}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X size={8} className="text-white" />
                            </button>
                        )}
                    </div>
                ))}

                {!readOnly && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-8 h-8 rounded-full border border-dashed border-white/20 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                    >
                        <User size={14} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search members..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-text-secondary focus:outline-none focus:border-primary/50"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                            {filteredMembers.length === 0 ? (
                                <>
                                    <div className="text-center py-4 text-xs text-text-secondary">No members found</div>
                                    {onInvite && search.includes('@') && (
                                        <button
                                            onClick={() => {
                                                onInvite(search);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className="w-full text-left p-2 hover:bg-white/5 flex items-center gap-3 border-t border-white/5 mx-1 my-1"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Invite & Assign</p>
                                                <p className="text-xs text-text-secondary">{search}</p>
                                            </div>
                                        </button>
                                    )}
                                </>
                            ) : (
                                filteredMembers.map((member) => {
                                    const assigned = isAssigned(member.id);
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => {
                                                if (assigned) return;
                                                onAssign(member.id);
                                                setIsOpen(false);
                                            }}
                                            disabled={assigned}
                                            className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${assigned ? 'opacity-50 cursor-default' : 'hover:bg-white/5 cursor-pointer'}`}
                                        >
                                            <UserAvatar
                                                userId={member.organizationMember.user.id}
                                                firstName={member.organizationMember.user.firstName}
                                                lastName={member.organizationMember.user.lastName}
                                                avatarUrl={member.organizationMember.user.avatarUrl}
                                                size="md"
                                                className="bg-gradient-to-br from-gray-700 to-gray-600 ring-1 ring-white/10"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm text-white font-medium">
                                                    {member.organizationMember.user.firstName} {member.organizationMember.user.lastName}
                                                </div>
                                                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                                                    {member.role.name}
                                                </div>
                                            </div>
                                            {assigned && <Check size={14} className="text-primary" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
