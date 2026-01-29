
import axios from 'axios';

const API_URL = 'http://localhost:4000';

export interface FileData {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    projectId?: string;
    taskId?: string; // Origin task
    createdById: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
    versions?: FileVersion[];
    _count?: {
        versions: number;
        links: number;
    };
}

export interface FileVersion {
    id: string;
    version: number;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
    createdById: string;
}

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const FileService = {
    uploadFile: async (file: File, projectId: string, taskId?: string, commentId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        if (taskId) formData.append('taskId', taskId);
        if (commentId) formData.append('commentId', commentId);

        const res = await axios.post(`${API_URL}/files/upload`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    },

    uploadVersion: async (fileId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await axios.post(`${API_URL}/files/${fileId}/version`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    },

    getProjectFiles: async (projectId: string) => {
        const res = await axios.get(`${API_URL}/files/project/${projectId}`, {
            headers: getAuthHeader()
        });
        return res.data as FileData[];
    },

    deleteFile: async (fileId: string) => {
        await axios.delete(`${API_URL}/files/${fileId}`, {
            headers: getAuthHeader()
        });
    },

    getFileUrl: (filename: string) => {
        // If it's already a full URL (like Cloudinary), return it directly
        if (filename.startsWith('http')) return filename;

        // Direct link to serve endpoint for local files
        // In S3 world, this would be a pre-signed URL or direct public URL
        // Since backend route is /serve/:filename, we construct that.
        // BUT, backend File object stores `url` as `uploads/filename`.
        // We need to extract filename or just blindly use what backend gives if it returned full URL.
        // Our backend service returns `url` as `uploads/filename`.
        // So we need to strip `uploads/` or handle it.
        // Ideally backend returns full actionable URL.
        // For now:
        const cleanName = filename.replace('uploads/', '').replace('uploads\\', '');
        return `${API_URL}/files/serve/${cleanName}`;
    }
};
