
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { File, FileVersion } from '@prisma/client';

export class FileService {
    private uploadDir: string;

    constructor() {
        // Ensure uploads directory exists
        this.uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Upload a new file
     */
    async uploadFile(
        file: Express.Multer.File,
        userId: string,
        projectId: string,
        taskId?: string,
        commentId?: string
    ) {
        // 1. Move file to permanent location if needed (Multer handles temp)
        // For now, we assume Multer saves to 'uploads/' and we just track the path
        // In production, upload to S3 here.

        const relativePath = `uploads/${file.filename}`;

        // 2. Create File Record
        const newFile = await prisma.file.create({
            data: {
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: relativePath, // Or S3 URL
                projectId,
                // taskId: taskId ? taskId : undefined, // Keep generic, use links for specific context
                // If we want to support the "File created in Task" context, we can set it.
                // But for pure linking, we might just set projectId.
                // However, schema has taskId. Let's set it if provided to maintain context.
                taskId: taskId || null,
                createdById: userId,
                versions: {
                    create: {
                        version: 1,
                        name: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: relativePath,
                        createdById: userId
                    }
                }
            },
            include: {
                versions: true
            }
        });

        // 3. Create initial link
        await this.createFileLink(newFile.id, { taskId, commentId, projectId });

        return newFile;
    }

    /**
     * Upload a new version for an existing file
     */
    async uploadVersion(
        fileId: string,
        file: Express.Multer.File,
        userId: string
    ) {
        const relativePath = `uploads/${file.filename}`;

        const existingFile = await prisma.file.findUnique({
            where: { id: fileId },
            include: { versions: true }
        });

        if (!existingFile) throw new Error('File not found');

        const nextVersion = existingFile.versions.length + 1;

        // Transaction: Create Version + Update File Metadata
        const updatedFile = await prisma.$transaction([
            prisma.fileVersion.create({
                data: {
                    fileId,
                    version: nextVersion,
                    name: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: relativePath,
                    createdById: userId
                }
            }),
            prisma.file.update({
                where: { id: fileId },
                data: {
                    name: file.originalname, // Update current name
                    mimeType: file.mimetype,
                    size: file.size,
                    url: relativePath, // Point to latest
                    updatedAt: new Date()
                }
            })
        ]);

        return updatedFile[1]; // Return File
    }

    /**
     * Link an existing file to a new entity (Task, Comment, etc.)
     */
    async createFileLink(fileId: string, context: { taskId?: string, commentId?: string, projectId?: string }) {
        // Prevent duplicate links
        // If linking to Task
        if (context.taskId) {
            const exists = await prisma.fileLink.findFirst({
                where: { fileId, taskId: context.taskId }
            });
            if (exists) return exists;
            return prisma.fileLink.create({
                data: { fileId, taskId: context.taskId }
            });
        }

        // If linking to Comment
        if (context.commentId) {
            const exists = await prisma.fileLink.findFirst({
                where: { fileId, commentId: context.commentId }
            });
            if (exists) return exists;
            return prisma.fileLink.create({
                data: { fileId, commentId: context.commentId }
            });
        }

        // If linking to Project (explicitly showing in Dashboard if not already)
        // Usually File.projectId handles ownership, but Link handles explicit "attachment" logic?
        // Actually, Project Files Tab usually shows ALL files with File.projectId OR FileLink.projectId
        if (context.projectId) {
            // Check ownership
            const file = await prisma.file.findUnique({ where: { id: fileId } });
            if (file?.projectId === context.projectId) return; // Already belongs to project

            // Otherwise create link
            return prisma.fileLink.create({
                data: { fileId, projectId: context.projectId }
            });
        }
    }

    async getProjectFiles(projectId: string) {
        // Get files owned by project OR linked to project/tasks/comments within project
        // This can be complex. For now, strictly files OWNED by project + Files linked to task of project?
        // Simplest: Files where projectId = id.
        // User requirement: "Files Tab Shows all File records linked to project"

        return prisma.file.findMany({
            where: { projectId },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true }
                },
                _count: { select: { versions: true, links: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async getFileDetails(fileId: string) {
        return prisma.file.findUnique({
            where: { id: fileId },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { versions: true, links: true } }
            }
        });
    }

    async getFileVersions(fileId: string) {
        return prisma.fileVersion.findMany({
            where: { fileId },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { version: 'desc' }
        });
    }

    async getFileLinks(fileId: string) {
        return prisma.fileLink.findMany({
            where: { fileId },
            include: {
                task: { select: { id: true, title: true } },
                project: { select: { id: true, name: true } },
                comment: { select: { id: true, content: true } }
            }
        });
    }

    async linkFile(fileId: string, entityId: string, type: 'PROJECT' | 'TASK' | 'COMMENT', userId: string) {
        const data: any = { fileId };
        if (type === 'PROJECT') data.projectId = entityId;
        if (type === 'TASK') data.taskId = entityId;
        if (type === 'COMMENT') data.commentId = entityId;

        // Check if link exists
        const exists = await prisma.fileLink.findFirst({
            where: { fileId, ...data }
        });

        if (exists) return exists;

        return prisma.fileLink.create({
            data
        });
    }
}

export default new FileService();
