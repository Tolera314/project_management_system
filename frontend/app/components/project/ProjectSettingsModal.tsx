import { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2, Palette } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';
import { useToast } from '../ui/Toast';
import { useRouter } from 'next/navigation';

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: {
        id: string;
        name: string;
        description?: string | null;
        color?: string;
        status?: string;
    };
    onUpdate?: () => void;
}

const COLORS = [
    '#4F46E5', // Indigo
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6366F1', // Indigo Light
];

export default function ProjectSettingsModal({ isOpen, onClose, project, onUpdate }: ProjectSettingsModalProps) {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [color, setColor] = useState(project.color || '#4F46E5');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setName(project.name);
            setDescription(project.description || '');
            setColor(project.color || '#4F46E5');
        }
    }, [isOpen, project]);

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('error', 'Validation Error', 'Project name is required');
            return;
        }

        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description, color })
            });

            if (!response.ok) throw new Error('Failed to update project');

            showToast('success', 'Project Updated', 'Your changes have been saved.');
            onUpdate?.();
            onClose();
            router.refresh();
        } catch (error) {
            console.error('Update failed:', error);
            showToast('error', 'Update Failed', 'Could not save project settings.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Project Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="My Awesome Project"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="What is this project about?"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Color</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 focus:outline-none ${color === c ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-[#0A0A0A]' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
