'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Users, Info } from 'lucide-react';

export default function WorkspaceRolesList() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<any>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            const token = localStorage.getItem('token');
            const selectedId = localStorage.getItem('selectedWorkspaceId');
            if (!token) return;

            try {
                // First get workspace info
                const wsRes = await fetch(selectedId
                    ? `http://localhost:4000/workspaces/me?workspaceId=${selectedId}`
                    : 'http://localhost:4000/workspaces/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const wsData = await wsRes.json();
                if (wsData.workspace) setWorkspace(wsData.workspace);

                // Then get roles
                if (wsData.workspace?.id) {
                    const res = await fetch(`http://localhost:4000/workspaces/${wsData.workspace.id}/roles`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.roles) setRoles(data.roles);
                }
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, []);

    if (loading) return <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-full" />
        <div className="h-64 bg-white/5 rounded-2xl w-full" />
    </div>;

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Members</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Permissions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${role.isSystem ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {role.isSystem ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                            </div>
                                            <span className="font-medium text-white">{role.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {role.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                            <Users className="w-3.5 h-3.5" />
                                            {role._count?.members || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions?.length > 0 ? (
                                                role.permissions.slice(0, 3).map((rp: any) => (
                                                    <span key={rp.permission.id} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/5">
                                                        {rp.permission.name.replace(/_/g, ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">No explicit permissions</span>
                                            )}
                                            {role.permissions?.length > 3 && (
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-500 border border-white/5">
                                                    +{role.permissions.length - 3} more
                                                </span>
                                            )}
                                            {role.name === 'Admin' && (
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    Full Access
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="text-white font-medium mb-1">About Permissions</p>
                    <p className="text-slate-400 leading-relaxed">
                        System roles like Admin and Project Manager have predefined permissions that ensure the safety and security of your workspace.
                        Currently, custom role creation is available on the Enterprise plan.
                    </p>
                </div>
            </div>
        </div>
    );
}
