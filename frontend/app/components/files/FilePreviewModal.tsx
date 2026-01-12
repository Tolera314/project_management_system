
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Clock, FileText, MoreVertical, Upload, Trash2, Calendar } from 'lucide-react';
import { FileData, FileService } from '../../services/file.service';
import { format } from 'date-fns';

interface FilePreviewModalProps {
    file: FileData | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (fileId: string) => void;
    onUpdate?: (updatedFile: FileData) => void;
}

export default function FilePreviewModal({
    file,
    isOpen,
    onClose,
    onDelete,
    onUpdate
}: FilePreviewModalProps) {
    const [uploadingVersion, setUploadingVersion] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen || !file) return null;

    const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFile = e.target.files?.[0];
        if (!newFile) return;

        try {
            setUploadingVersion(true);
            const updated = await FileService.uploadVersion(file.id, newFile);
            onUpdate?.(updated);
        } catch (error) {
            console.error("Failed to upload version", error);
            // Optionally show toast error
        } finally {
            setUploadingVersion(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this file? This cannot be undone.")) {
            try {
                await FileService.deleteFile(file.id);
                onDelete?.(file.id);
                onClose();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const isImage = file.mimeType.startsWith('image/');
    const downloadUrl = FileService.getFileUrl(file.url); // Use backend serve URL

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface border border-border w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden pointer-events-auto"
                        >
                            {/* Main Prevention Area */}
                            <div className="flex-1 flex flex-col bg-background/50 relative">
                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                    <h2 className="text-lg font-bold text-text-primary px-3 py-1 bg-surface/80 backdrop-blur rounded-lg border border-border shadow-sm">
                                        {file.name}
                                    </h2>
                                </div>

                                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                                    {isImage ? (
                                        <img
                                            src={downloadUrl}
                                            alt={file.name}
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                        />
                                    ) : (
                                        <div className="text-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
                                            <FileText size={64} className="text-text-secondary mx-auto mb-4" />
                                            <p className="text-text-primary font-medium">Preview not available</p>
                                            <p className="text-sm text-text-secondary mt-1">
                                                {file.mimeType} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <a
                                                href={downloadUrl}
                                                download
                                                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                <Download size={16} />
                                                Download File
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="w-80 border-l border-border bg-surface flex flex-col">
                                <div className="p-4 border-b border-border flex items-center justify-between">
                                    <h3 className="font-semibold text-text-primary">Details</h3>
                                    <button onClick={onClose} className="p-1 hover:bg-background rounded-lg transition-colors">
                                        <X size={18} className="text-text-secondary" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <a
                                            href={downloadUrl}
                                            download
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-secondary hover:bg-border border border-border rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Download size={16} />
                                            Download
                                        </a>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingVersion}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-secondary hover:bg-border border border-border rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Upload size={16} />
                                            {uploadingVersion ? '...' : 'New Version'}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleUploadVersion}
                                        />
                                    </div>

                                    {/* Meta */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-text-secondary">Size</span>
                                            <span className="font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-text-secondary">Type</span>
                                            <span className="font-medium truncate max-w-[150px]">{file.mimeType}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-text-secondary">Uploaded</span>
                                            <span className="font-medium">{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-text-secondary">By</span>
                                            <span className="font-medium">{file.createdBy?.firstName || 'User'}</span>
                                        </div>
                                    </div>

                                    {/* Versions */}
                                    <div>
                                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Version History</h4>
                                        <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                            {file.versions?.sort((a, b) => b.version - a.version).map((v) => (
                                                <div key={v.id} className="relative pl-6">
                                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-surface bg-primary ring-2 ring-primary/20 z-10" />
                                                    <div className="bg-surface-secondary/50 rounded-lg p-3 border border-border">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-text-primary">Version {v.version}</span>
                                                            <span className="text-[10px] text-text-secondary">{format(new Date(v.createdAt), 'MMM d')}</span>
                                                        </div>
                                                        <p className="text-xs text-text-secondary truncate">{v.name}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Current File (if versions relation not fully populated or just initial) */}
                                            {(!file.versions || file.versions.length === 0) && (
                                                <div className="relative pl-6">
                                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-surface bg-primary z-10" />
                                                    <div className="bg-surface-secondary/50 rounded-lg p-3 border border-border">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-text-primary">Current</span>
                                                            <span className="text-[10px] text-text-secondary">{format(new Date(file.createdAt), 'MMM d')}</span>
                                                        </div>
                                                        <p className="text-xs text-text-secondary">Initial Upload</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-6 mt-6 border-t border-border">
                                        <button
                                            onClick={handleDelete}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Delete File
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
