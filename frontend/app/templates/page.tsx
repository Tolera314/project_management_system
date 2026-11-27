'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Plus, Layout, Calendar, CheckSquare, MoreHorizontal, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TemplatePreviewModal from '../components/templates/TemplatePreviewModal';
import TemplateConfigModal from '../components/templates/TemplateConfigModal';
import { useToast } from '../components/ui/Toast';
import { API_BASE_URL } from '../config/api.config';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
    const [configTemplateId, setConfigTemplateId] = useState<string | null>(null);
    const [configTemplateName, setConfigTemplateName] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const router = useRouter();
    const { showToast } = useToast();

    const categories = ['All', 'Software', 'Marketing', 'Operations', 'Design', 'Other'];

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTemplates();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeCategory]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            if (!token) {
                router.push('/login');
                return;
            }

            // Using the new dedicated templates endpoint with search and category
            const categoryParam = activeCategory !== 'All' ? `&category=${activeCategory}` : '';
            const searchParam = searchQuery ? `&search=${searchQuery}` : '';
            const res = await fetch(`${API_BASE_URL}/templates?${categoryParam}${searchParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch templates');
            }

            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (err: any) {
            console.error('Failed to fetch templates', err);
            setError(err.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = () => {
        showToast('info', 'How to Create Helper', 'To create a template, first create a regular project, then use "Save as Template" in project settings.');
    };

    const handleTemplateClick = (templateId: string) => {
        setPreviewTemplateId(templateId);
    };

    const handleUseTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setConfigTemplateId(templateId);
            setConfigTemplateName(template.name);
        }
    };

    const handleCreateFromTemplate = async (config: any) => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) {
                router.push('/login');
                return;
            }

            const user = JSON.parse(userStr);
            const organizationId = user.organizations?.[0]?.id;

            const res = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: config.name,
                    description: config.description,
                    startDate: config.startDate,
                    organizationId,
                    templateId: config.templateId,
                    priority: 'MEDIUM',
                    status: 'NOT_STARTED',
                    dependencyIds: []
                })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/projects/${data.project.id}`);
            } else {
                throw new Error('Failed to create project');
            }
        } catch (err: any) {
            console.error('Failed to create project from template', err);
            showToast('error', 'Creation Failed', 'Failed to create project. Please try again.');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchTemplates();
            } else {
                throw new Error('Failed to delete template');
            }
        } catch (err) {
            console.error('Delete template error:', err);
            showToast('error', 'Delete Failed', 'Failed to delete template.');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header - Responsive */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Project Templates</h1>
                        <p className="text-sm sm:text-base text-text-secondary">Standardize your workflow with reusable project structures.</p>
                    </div>
                    <button
                        onClick={handleCreateTemplate}
                        className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 w-full sm:w-auto"
                    >
                        <Plus size={18} />
                        <span>New Template</span>
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-surface text-text-secondary hover:text-white border border-white/5'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={fetchTemplates}
                            className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Loading State - Responsive Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 sm:h-56 rounded-xl bg-surface border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : templates.length === 0 ? (
                    /* Empty State - Responsive */
                    <div className="text-center py-12 sm:py-20 bg-surface/50 rounded-2xl border border-white/5 border-dashed">
                        <Layout size={48} className="text-text-secondary mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 px-4">No Templates Yet</h3>
                        <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto mb-6 px-4">
                            Create your first template to speed up project creation. You can save any existing project as a template.
                        </p>
                    </div>
                ) : (
                    /* Template Grid - Fully Responsive */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className="group bg-surface hover:bg-surface/80 border border-white/5 hover:border-primary/20 rounded-xl p-5 sm:p-6 transition-all cursor-pointer relative"
                                onClick={() => handleTemplateClick(template.id)}
                            >
                                {/* Visibility Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${template.isPublic
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}
                                    >
                                        {template.isPublic ? 'Workspace' : 'Private'}
                                    </span>
                                </div>
                                {/* More Options - Hidden on mobile, visible on hover for desktop */}
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 group/menu">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        className="p-1.5 hover:bg-white/10 rounded text-text-secondary hover:text-white"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>

                                    {/* Action Menu (simulated with CSS for now) */}
                                    <div className="absolute top-full right-0 mt-1 w-32 bg-surface-lighter border border-white/10 rounded-lg shadow-xl py-1 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/templates/${template.id}/edit`);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/5"
                                        >
                                            Edit Structure
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTemplate(template.id);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Template Icon */}
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3 sm:mb-4 mt-4 text-primary">
                                    <Layout size={20} className="sm:w-6 sm:h-6" />
                                </div>

                                {/* Template Info */}
                                <h3 className="text-base sm:text-lg font-bold text-white mb-2 pr-8">{template.name}</h3>
                                <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 mb-4 sm:mb-6 min-h-[2.5rem] sm:min-h-[2.5rem]">
                                    {template.description || 'No description provided.'}
                                </p>

                                {/* Template Stats */}
                                <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-text-secondary">
                                    <div className="flex items-center gap-1.5">
                                        <CheckSquare size={14} />
                                        <span>{template._count?.tasks || 0} Tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>{template._count?.milestones || 0} Milestones</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <TemplatePreviewModal
                isOpen={!!previewTemplateId}
                onClose={() => setPreviewTemplateId(null)}
                templateId={previewTemplateId || ''}
                onUseTemplate={handleUseTemplate}
            />

            {/* Config Modal */}
            <TemplateConfigModal
                isOpen={!!configTemplateId}
                onClose={() => {
                    setConfigTemplateId(null);
                    setConfigTemplateName('');
                }}
                templateId={configTemplateId || ''}
                templateName={configTemplateName}
                onSubmit={handleCreateFromTemplate}
            />
        </DashboardLayout>
    );
}
