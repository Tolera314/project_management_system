import { useState } from 'react';

import {
    Plus,
    LayoutGrid,
    ListFilter,
    Search,
    Share2,
    MoreHorizontal,
    ChevronRight,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    Diamond,
    Layout,
    File as FileIcon,
    Download,
    FileText,
    FileJson,
    FileCode
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import SaveAsTemplateModal from '../templates/SaveAsTemplateModal';
import { useUser } from '../../context/UserContext';
import UserAvatar from '../shared/UserAvatar';

interface ProjectHeaderProps {
    project: any;
    activeView: string;
    onViewChange: (view: string) => void;
    onCreateList?: () => void;
    onInviteMember?: () => void;
    canInvite?: boolean;
    sortBy?: 'default' | 'priority' | 'dueDate';
    onSortChange?: (sort: 'default' | 'priority' | 'dueDate') => void;
    filterStatus?: string | null;
    filterAssignee?: string | null;
    onFilterChange?: (type: 'status' | 'assignee', value: string | null) => void;
    onManageMembers?: () => void;
    projectId?: string;
}

export default function ProjectHeader({
    project,
    activeView,
    onViewChange,
    onCreateList,
    onInviteMember,
    canInvite = false,
    sortBy,
    onSortChange,
    filterStatus,
    filterAssignee,
    onFilterChange,
    onManageMembers,
    projectId
}: ProjectHeaderProps) {
    const [showCreateMenu, setShowCreateMenu] = useState<boolean | 'more' | 'export'>(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
    const { user } = useUser();

    const handleExportReport = async (format: 'json' | 'csv' | 'pdf') => {
        try {
            const token = localStorage.getItem('token');
            if (!projectId || !token) return;

            if (format === 'pdf') {
                // For PDF, open in new tab for browser print
                const response = await fetch(`http://localhost:4000/projects/${projectId}/report`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                const printWindow = window.open('', '_blank');
                if (!printWindow) return;

                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Project Report - ${project.name}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 40px; }
                            h1 { color: #4f46e5; }
                            .metric { margin: 10px 0; }
                            .risk { color: #ef4444; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f3f4f6; }
                        </style>
                    </head>
                    <body>
                        <h1>Project Report: ${data.project?.name}</h1>
                        <p><strong>Generated:</strong> ${new Date(data.project?.generatedAt).toLocaleString()}</p>
                        <h2>Metrics</h2>
                        <div class="metric"><strong>Total Tasks:</strong> ${data.metrics?.totalTasks}</div>
                        <div class="metric"><strong>Completed:</strong> ${data.metrics?.completedTasks}</div>
                        <div class="metric"><strong>In Progress:</strong> ${data.metrics?.inProgressTasks}</div>
                        <div class="metric"><strong>Blocked:</strong> ${data.metrics?.blockedTasks}</div>
                        <div class="metric"><strong>Progress:</strong> ${data.status?.progress}%</div>
                        <h2>Risks</h2>
                        ${data.risks?.length > 0 ? data.risks.map((r: any) =>
                    `<div class="risk">⚠ ${r.type}: ${r.title}</div>`
                ).join('') : '<p>No risks identified</p>'}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); }, 500);
                setShowCreateMenu(false);
                return;
            }

            const url = `http://localhost:4000/projects/${projectId}/report?format=${format}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${project.name}_report_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            setShowCreateMenu(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    };

    // ... views definition ...
    const views = [
        { id: 'list', label: 'List', icon: LayoutGrid },
        { id: 'board', label: 'Board', icon: LayoutGrid },
        { id: 'milestones', label: 'Milestones', icon: CheckCircle2 },
        { id: 'timeline', label: 'Timeline', icon: LayoutGrid },
        { id: 'files', label: 'Files', icon: FileIcon },
    ];

    const activeFilterCount = (filterStatus ? 1 : 0) + (filterAssignee ? 1 : 0);

    return (
        <div className="sticky top-0 z-20 bg-background/80 border-b border-white/5 px-6 py-4">
            {/* ... Top Row ... */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            <Link href="/dashboard" className="hover:text-white transition-colors">Workspace</Link>
                            <ChevronRight size={12} />
                            <span className="text-text-primary">Projects</span>
                        </div>
                    </div>
                    {/* Members stack - Moved to right side per request */}
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 mr-2">
                            {project.members?.filter((m: any) => m.organizationMember?.user).map((member: any) => {
                                const isPM = member.role?.name === 'Project Manager';
                                const user = member.organizationMember.user;
                                return (
                                    <div
                                        key={member.id}
                                        className={`w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br \${isPM ? 'from-primary to-accent scale-110 z-10' : 'from-slate-200 to-slate-300'} flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-white/5 uppercase overflow-hidden shadow-sm`}
                                        title={`\${isPM ? '[PM] ' : ''}\${user.firstName} \${user.lastName}`}
                                    >
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user.firstName[0]}{user.lastName[0]}</span>
                                        )}
                                    </div>
                                );
                            })}

                            <button
                                onClick={onInviteMember}
                                disabled={!canInvite}
                                className={`w-8 h-8 rounded-full border-2 border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center text-text-secondary hover:text-primary transition-all \${!canInvite ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Share Button */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Project link copied to clipboard!');
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-hover-bg rounded-lg transition-colors text-slate-600 dark:text-text-secondary hover:text-primary dark:hover:text-primary"
                            title="Copy Project Link"
                        >
                            <Share2 size={18} />
                        </button>

                        {/* More Options Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCreateMenu(showCreateMenu === 'more' ? false : 'more' as any)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-hover-bg rounded-lg transition-colors text-slate-600 dark:text-text-secondary hover:text-primary dark:hover:text-primary"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {showCreateMenu === 'more' as any && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1">
                                        <button
                                            onClick={() => {
                                                setShowCreateMenu('export' as any);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <Download size={16} />
                                            Export Report
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                onManageMembers?.();
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <Share2 size={16} />
                                            Manage Members
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                alert('Project Settings coming soon!');
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center gap-2"
                                        >
                                            <LayoutGrid size={16} />
                                            Project Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                setShowSaveAsTemplate(true);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <Layout size={16} />
                                            Save as Template
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* Export Format Menu */}
                            {showCreateMenu === 'export' as any && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1">
                                        <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-text-secondary uppercase">Export Format</div>
                                        <button
                                            onClick={() => handleExportReport('json')}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <FileJson size={16} />
                                            JSON
                                        </button>
                                        <button
                                            onClick={() => handleExportReport('csv')}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            CSV (Excel)
                                        </button>
                                        <button
                                            onClick={() => handleExportReport('pdf')}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <FileCode size={16} />
                                            PDF (Print)
                                        </button>
                                        <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                                        <button
                                            onClick={() => setShowCreateMenu('more' as any)}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Project Title and Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                        style={{
                            backgroundColor: `${project.color || '#4F46E5'}15`,
                            border: `1px solid ${project.color || '#4F46E5'}40`
                        }}
                    >
                        <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: project.color || '#4F46E5' }}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-text-primary tracking-tight">{project.name}</h1>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                On Track
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex items-center p-1 bg-surface-lighter/50 rounded-lg border border-white/5">
                        {views.map((view) => (
                            <button
                                key={view.id}
                                onClick={() => onViewChange(view.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeView === view.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-text-secondary hover:text-white'
                                    }`}
                            >
                                <view.icon size={14} />
                                {view.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-[1px] bg-white/10 mx-1" />

                    <div className="flex items-center gap-1">
                        {/* Filter Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className={`p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${activeFilterCount > 0 ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                            >
                                <Filter size={16} />
                                Filter {activeFilterCount > 0 && <span className="bg-primary/20 text-primary px-1.5 rounded-full text-[10px]">{activeFilterCount}</span>}
                            </button>
                            {showFilterMenu && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-2 space-y-2">
                                    {/* Assignee Filter */}
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Assignee</div>
                                        <div className="space-y-0.5">
                                            <button onClick={() => { onFilterChange?.('assignee', null); setShowFilterMenu(false); }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex justify-between ${!filterAssignee ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                                All Members {!filterAssignee && <CheckCircle2 size={12} />}
                                            </button>
                                            <button onClick={() => { onFilterChange?.('assignee', 'me'); setShowFilterMenu(false); }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex justify-between ${filterAssignee === 'me' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                                Assigned to Me {filterAssignee === 'me' && <CheckCircle2 size={12} />}
                                            </button>
                                            <button onClick={() => { onFilterChange?.('assignee', 'unassigned'); setShowFilterMenu(false); }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex justify-between ${filterAssignee === 'unassigned' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                                Unassigned {filterAssignee === 'unassigned' && <CheckCircle2 size={12} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-[1px] bg-white/5" />

                                    {/* Status Filter */}
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Status</div>
                                        <div className="space-y-0.5">
                                            <button onClick={() => { onFilterChange?.('status', null); setShowFilterMenu(false); }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex justify-between ${!filterStatus ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                                All Statuses {!filterStatus && <CheckCircle2 size={12} />}
                                            </button>
                                            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => { onFilterChange?.('status', status); setShowFilterMenu(false); }}
                                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex justify-between items-center ${filterStatus === status ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    <span className="capitalize">{status.replace('_', ' ').toLowerCase()}</span>
                                                    {filterStatus === status && <CheckCircle2 size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(filterStatus || filterAssignee) && (
                                        <>
                                            <div className="h-[1px] bg-white/5" />
                                            <button
                                                onClick={() => { onFilterChange?.('status', null); onFilterChange?.('assignee', null); setShowFilterMenu(false); }}
                                                className="w-full text-center px-2 py-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                                            >
                                                Clear Filters
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className={`p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${sortBy !== 'default' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                            >
                                <ArrowUpDown size={16} />
                                Sort {sortBy !== 'default' && <span className="capitalize">({sortBy})</span>}
                            </button>
                            {showSortMenu && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1">
                                        {[
                                            { id: 'default', label: 'Default' },
                                            { id: 'priority', label: 'Priority' },
                                            { id: 'dueDate', label: 'Due Date' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    onSortChange?.(opt.id as any);
                                                    setShowSortMenu(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${sortBy === opt.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
                                            >
                                                {opt.label}
                                                {sortBy === opt.id && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="flex items-center gap-2 pl-4 pr-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/25 active:scale-95 ml-2"
                        >
                            <Plus size={18} />
                            Create
                        </button>

                        {/* Create Menu Dropdown */}
                        {showCreateMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setShowCreateMenu(false);
                                            onCreateList?.();
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <LayoutGrid size={16} />
                                        Create List
                                    </button>
                                    {canInvite && (
                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                onInviteMember?.();
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <Share2 size={16} />
                                            Invite Member
                                        </button>
                                    )}
                                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={16} />
                                        Create Task
                                    </button>
                                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <Diamond size={16} />
                                        Create Milestone
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

