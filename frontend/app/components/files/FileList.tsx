
import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, File as FileIcon, Image as ImageIcon, Video, Grid, List as ListIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { FileService, FileData } from '../../services/file.service';
import FileUploader from './FileUploader';
import FilePreviewModal from './FilePreviewModal';

interface FileListProps {
    projectId: string;
}

export default function FileList({ projectId }: FileListProps) {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

    useEffect(() => {
        loadFiles();
    }, [projectId]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            const data = await FileService.getProjectFiles(projectId);
            setFiles(data);
        } catch (error) {
            console.error("Failed to load files", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = (newFile: FileData) => {
        setFiles(prev => [newFile, ...prev]);
    };

    const handleFileUpdate = (updatedFile: FileData) => {
        setFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
        setSelectedFile(updatedFile); // Update modal preview
    };

    const handleFileDelete = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        setSelectedFile(null);
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon size={20} className="text-purple-500" />;
        if (mimeType.startsWith('video/')) return <Video size={20} className="text-pink-500" />;
        return <FileIcon size={20} className="text-blue-500" />;
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-surface-secondary text-primary shadow-sm' : 'text-text-secondary hover:bg-surface-secondary'}`}
                    >
                        <ListIcon size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-surface-secondary text-primary shadow-sm' : 'text-text-secondary hover:bg-surface-secondary'}`}
                    >
                        <Grid size={18} />
                    </button>
                </div>
            </div>

            {/* Upload Area */}
            <FileUploader
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
                className="mb-8"
            />

            {/* File List */}
            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-text-secondary">Loading files...</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-surface/50">
                    <p className="text-text-secondary">No files found.</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-secondary border-b border-border text-text-secondary font-medium">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Size</th>
                                <th className="px-6 py-3">Uploaded By</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredFiles.map(file => (
                                <tr
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className="hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(file.mimeType)}
                                            <span className="font-medium text-text-primary">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-text-secondary">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            {file.createdBy?.avatarUrl ? (
                                                <img src={file.createdBy.avatarUrl} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {file.createdBy?.firstName?.[0]}
                                                </div>
                                            )}
                                            <span className="text-text-secondary">{file.createdBy?.firstName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-text-secondary">
                                        {format(new Date(file.updatedAt), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button className="p-2 hover:bg-surface-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download size={16} className="text-text-secondary" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredFiles.map(file => (
                        <div
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className="bg-surface border border-border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center gap-3 aspect-square justify-center relative hover:border-primary/50"
                        >
                            {/* Preview Thumbnail (if image) */}
                            {file.mimeType.startsWith('image/') && file.url ? (
                                <div className="absolute inset-x-2 inset-t-2 bottom-12 rounded-lg overflow-hidden bg-background">
                                    <img
                                        src={FileService.getFileUrl(file.url)}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {getFileIcon(file.mimeType)}
                                </div>
                            )}

                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="font-medium text-sm text-text-primary truncate">{file.name}</p>
                                <p className="text-xs text-text-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <FilePreviewModal
                file={selectedFile}
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                onUpdate={handleFileUpdate}
                onDelete={handleFileDelete}
            />
        </div>
    );
}
