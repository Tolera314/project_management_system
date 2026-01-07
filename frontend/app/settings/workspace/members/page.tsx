'use client';

import React from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import WorkspaceMembersList from '../../../components/dashboard/WorkspaceMembersList';
import { motion } from 'framer-motion';
import { Building, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceMembersPage() {
    return (
        <DashboardLayout>
            <div className="p-6 md:p-10 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Workspace Members</h1>
                    </div>
                    <p className="text-slate-400">Manage access and roles for your team.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-3 space-y-2">
                        <Link
                            href="/settings/workspace"
                            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
                        >
                            <Building className="w-4 h-4" />
                            General
                        </Link>
                        <Link
                            href="/settings/workspace/members"
                            className="flex items-center gap-3 px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 font-medium transition-all"
                        >
                            <Users className="w-4 h-4" />
                            Members
                        </Link>
                        <Link
                            href="/settings/workspace/roles"
                            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
                        >
                            <Shield className="w-4 h-4" />
                            Roles & Permissions
                        </Link>
                    </div>

                    <div className="lg:col-span-9">
                        <WorkspaceMembersList />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
