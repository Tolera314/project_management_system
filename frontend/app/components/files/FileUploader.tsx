
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FileService } from '../../services/file.service';

interface FileUploaderProps {
    projectId: string;
    taskId?: string;
    commentId?: string;
    onUploadComplete?: (file: any) => void;
    className?: string;
}

export default function FileUploader({
    projectId,
    taskId,
    commentId,
    onUploadComplete,
    className = ""
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        setError(null);
        setProgress(0);

        // Upload one by one for now (backend handles single file)
        // Ideally parallel, but let's keep it simple and robust
        for (const file of acceptedFiles) {
            try {
                const uploadedFile = await FileService.uploadFile(file, projectId, taskId, commentId);
                onUploadComplete?.(uploadedFile);
                setProgress((prev) => prev + (100 / acceptedFiles.length));
            } catch (err) {
                console.error("Upload failed", err);
                setError("Failed to upload one or more files.");
            }
        }

        setUploading(false);
        setProgress(0);
    }, [projectId, taskId, commentId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className={`w-full ${className}`}>
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                    ${isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-surface-secondary'
                    }
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-3 text-text-secondary">
                    <div className={`p-3 rounded-full ${isDragActive ? 'bg-primary/10 text-primary' : 'bg-surface border border-border'}`}>
                        <UploadCloud size={24} />
                    </div>
                    {isDragActive ? (
                        <p className="font-medium text-primary">Drop files here...</p>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-text-primary">Click to upload or drag and drop</p>
                            <p className="text-xs">Images, Videos, PDFs, Office docs, Audio, CSV, JSON up to 25MB</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Status / Error */}
            {uploading && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span className="text-sm font-medium">Uploading...</span>
                </div>
            )}

            {error && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
}
