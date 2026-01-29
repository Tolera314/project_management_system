
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Template, TemplateService } from '../../services/template.service';
import {
    Layout,
    Plus,
    ArrowRight,
    CheckCircle2,
    Clock,
    Target,
    Search,
    Filter,
    Layers,
    ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const organizationId = localStorage.getItem('selectedWorkspaceId');
            const data = await TemplateService.getTemplates({ organizationId });
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const templatesArray = Array.isArray(templates) ? templates : [];
    const categories = ['All', ...Array.from(new Set(templatesArray.map(t => t.category || 'Other')))];

    const filteredTemplates = templatesArray.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Project Templates</h1>
                        <p className="text-text-secondary">Accelerate your workflow with production-ready blueprints</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-surface-secondary text-text-secondary hover:text-white border border-border'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-surface-secondary/50 rounded-2xl animate-pulse border border-border/50" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredTemplates.map((template, idx) => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-surface border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 shadow-sm flex flex-col h-full"
                                >
                                    <div
                                        className="h-32 p-6 flex items-start justify-between"
                                        style={{ backgroundColor: `${template.color}15` }}
                                    >
                                        <div className="p-3 rounded-xl bg-white shadow-sm" style={{ color: template.color }}>
                                            <Layout size={24} />
                                        </div>
                                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                                            {template.category || 'Standard'}
                                        </span>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-text-secondary mb-6 line-clamp-2 flex-1">
                                            {template.description}
                                        </p>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                <Layers size={14} className="text-primary" />
                                                <span>{template._count?.lists || 0} Lists</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                <ListChecks size={14} className="text-primary" />
                                                <span>{template._count?.tasks || 0} Tasks</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => router.push(`/projects/${template.id}?preview=true`)}
                                                className="flex-1 py-2.5 bg-surface-secondary hover:bg-border border border-border rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => router.push(`/dashboard/projects?create=true&templateId=${template.id}`)}
                                                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                Use This
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && filteredTemplates.length === 0 && (
                    <div className="text-center py-24 bg-surface-secondary/20 rounded-3xl border-2 border-dashed border-border">
                        <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-text-secondary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                        <p className="text-text-secondary">Try adjusting your search or category filters</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
