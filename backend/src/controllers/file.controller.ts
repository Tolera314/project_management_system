
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
}

export default new FileController();
