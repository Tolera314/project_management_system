
import { Request, Response } from 'express';
import fileService from '../services/file.service';
import fs from 'fs';
import path from 'path';

export class FileController {

    uploadFile = async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { projectId, taskId, commentId } = req.body;
            const userId = (req as any).userId;

            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }

            const file = await fileService.uploadFile(
                req.file,
                userId,
                projectId,
                taskId,
                commentId
            );

            res.status(201).json(file);
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to upload file', details: error.message });
        }
    };

    uploadVersion = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
            const userId = (req as any).userId;

            const file = await fileService.uploadVersion(id, req.file, userId);
            res.json(file);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to upload version' });
        }
    };

    getProjectFiles = async (req: Request, res: Response) => {
        try {
            const { projectId } = req.params;
            const files = await fileService.getProjectFiles(projectId);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch files' });
        }
    };

    deleteFile = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // TODO: check permissions (Owner/Admin)
            await fileService.deleteFile(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete file' });
        }
    };

    // Serve files (Simple static serve for now, securely)
    serveFile = async (req: Request, res: Response) => {
        try {
            const { filename } = req.params;
            const filepath = path.join(process.cwd(), 'uploads', filename);

            if (fs.existsSync(filepath)) {
                res.sendFile(filepath);
            } else {
                res.status(404).send('File not found');
            }
        } catch (e) {
            res.status(500).end();
        }
    }

    getFileDetails = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const file = await fileService.getFileDetails(id);
            res.json(file);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch file details' });
        }
    };

    getFileVersions = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const versions = await fileService.getFileVersions(id);
            res.json(versions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch versions' });
        }
    };

    linkFile = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { type, entityId } = req.body; // type: 'PROJECT', 'TASK', 'COMMENT'
            const userId = (req as any).userId;

            const link = await fileService.linkFile(id, entityId, type, userId);
            res.status(201).json(link);
        } catch (error) {
            res.status(500).json({ error: 'Failed to link file' });
        }
    };

    getFileLinks = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const links = await fileService.getFileLinks(id);
            res.json(links);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch links' });
        }
    };

    downloadFile = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const file = await fileService.getFileDetails(id);
            if (!file) {
                res.status(404).json({ error: 'File not found' });
                return;
            }

            // Check if it's a Cloudinary URL
            if (file.url && file.url.includes('cloudinary.com')) {
                let downloadUrl = file.url;
                // Add fl_attachment to force download for Cloudinary files
                if (downloadUrl.includes('/upload/') && !downloadUrl.includes('/fl_attachment')) {
                    downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                }
                res.redirect(downloadUrl);
            } else {
                // Assume local file serve
                // If url is just the filename
                const filename = file.url ? path.basename(file.url) : file.name;
                const filepath = path.join(process.cwd(), 'uploads', filename);

                if (fs.existsSync(filepath)) {
                    res.download(filepath, file.name || filename);
                } else {
                    console.error(`File not found on disk: ${filepath}`);
                    res.status(404).json({ error: 'File source not found' });
                }
            }
        } catch (error) {
            console.error('Download error:', error);
            res.status(500).json({ error: 'Failed to initiate download' });
        }
    };
}

export default new FileController();
