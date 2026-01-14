import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ExternalLink,
    Type,
    Users,
    Palette,
    Pin,
    Archive,
    Trash2,
    CheckCircle2,
    Link as LinkIcon
} from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ProjectContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    onAction: (action: string) => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    subtext?: string;
    color?: string;
    showPlus?: boolean;
}

interface MenuSection {
    id: string;
    header?: string;
    items: MenuItem[];
}

export default function ProjectContextMenu({ isOpen, onClose, projectName, onAction }: ProjectContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sections: MenuSection[] = [
        {
            id: 'create',
            items: [
                { id: 'create-list', label: 'Create list', icon: Plus, subtext: 'Organize tasks under this project', color: 'text-primary', showPlus: true },
                { id: 'add-dependency', label: 'Add dependency', icon: LinkIcon, subtext: 'Link another project as dependency' },
            ]
        },
        {
            id: 'manage',
            header: 'Manage Project',
            items: [
                { id: 'open', label: 'Open project', icon: ExternalLink },
                { id: 'rename', label: 'Rename project', icon: Type },
                { id: 'members', label: 'Manage members', icon: Users },
                { id: 'appearance', label: 'Change color / icon', icon: Palette },
            ]
        },
        {
            id: 'status',
            header: 'Status',
            items: [
                { id: 'pin', label: 'Pin / Unpin', icon: Pin },
                { id: 'archive', label: 'Archive project', icon: Archive },
            ]
        },
        {
            id: 'danger',
            header: 'Danger',
            items: [
                { id: 'delete', label: 'Delete project', icon: Trash2, color: 'text-danger' },
            ]
        }
    ];

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-64 bg-surface border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden py-1.5 backdrop-blur-xl"
        >
            {sections.map((section, sIdx) => (
                <div key={section.id}>
                    {section.header && (
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary/60">
                            {section.header}
                        </div>
                    )}
                    <div className="px-1.5 py-1">
                        {section.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onAction(item.id);
                                    onClose();
                                }}
                                className={`w-full group flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-left`}
                            >
                                <div className={`mt-0.5 ${item.color || 'text-text-secondary'} group-hover:scale-110 transition-transform`}>
                                    <item.icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${item.color || 'text-text-primary'}`}>
                                        {item.label}
                                    </div>
                                    {item.subtext && (
                                        <div className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                                            {item.subtext}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                    {sIdx < sections.length - 1 && (
                        <div className="mx-3 border-b border-white/10 my-1" />
                    )}
                </div>
            ))}
        </motion.div>
    );
}
