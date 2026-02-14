'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Trash2, Mail, User, Plus, Search } from 'lucide-react';
import InviteToWorkspaceModal from '../workspace/InviteToWorkspaceModal';
import { useToast } from '../ui/Toast';
import { API_BASE_URL } from '../../config/api.config';

export default function WorkspaceMembersList() {
    const [members, setMembers] = useState<any[]>([]);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [roles, setRoles] = useState<any[]>([]);

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        const selectedId = localStorage.getItem('selectedWorkspaceId');
        if (!token) return;

        try {
            // First get workspace info to know current user's role
            const wsRes = await fetch(selectedId
                ? `${API_BASE_URL}/workspaces/me?workspaceId=${selectedId}`
                : `${API_BASE_URL}/workspaces/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const wsData = await wsRes.json();
            if (wsData.workspace) {
                setWorkspace(wsData.workspace);
                // Fetch roles for the dropdown
                const rolesRes = await fetch(`${API_BASE_URL}/workspaces/${wsData.workspace.id}/roles`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const rolesData = await rolesRes.json();
                if (rolesData.roles) setRoles(rolesData.roles);


                // Then get members
                const res = await fetch(`${API_BASE_URL}/workspaces/${wsData.workspace.id}/members`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.members) setMembers(data.members);
            }

            const userStr = localStorage.getItem('user');
            if (userStr) setCurrentUser(JSON.parse(userStr));

        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleRoleChange = async (memberId: string, newRoleId: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/members/${memberId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roleId: newRoleId })
            });

            if (res.ok) {
                const data = await res.json();
                // Update local state
                setMembers(members.map(m =>
                    m.id === memberId ? { ...m, role: data.member.role, roleId: newRoleId } : m
                ));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Update role error:', error);
            showToast('error', 'Update Failed', 'Failed to update role');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setMembers(members.filter(m => m.id !== memberId));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove member');
            }
        } catch (error) {
            alert('Failed to remove member');
            showToast('error', 'Remove Failed', 'Failed to remove member');
        }
    };

    const handleInvite = async (email: string, roleId: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/invitations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, roleId })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to invite');
        }
    };

    const filteredMembers = members.filter(m =>
        m.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isAdmin = workspace?.role === 'Admin' || workspace?.role === 'Owner';

    if (loading) return <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-full" />
        <div className="h-64 bg-white/5 rounded-2xl w-full" />
    </div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-auto flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="w-full md:w-auto px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Invite Member
                    </button>
                )}
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                                                {member.user.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {member.user.firstName} {member.user.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">{member.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isAdmin && member.user.id !== currentUser?.id ? (
                                            <select
                                                value={member.roleId}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${member.role.name === 'Admin'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-slate-800 text-slate-400 border-white/5'
                                                }`}>
                                                <Shield className="w-3 h-3" />
                                                {member.role.name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            {member.user.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredMembers.length === 0 && (
                    <div className="p-12 text-center">
                        <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-white font-medium mb-1">No members found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your search terms</p>
                    </div>
                )}
            </div>

            <InviteToWorkspaceModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                workspaceId={workspace?.id || ''}
                onInvite={handleInvite}
                roles={workspace?.roles || []}
            />
        </div>
    );
}
