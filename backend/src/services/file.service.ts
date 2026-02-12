
import prisma from '../lib/prisma';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary';
import { File, FileVersion } from '@prisma/client';

export class FileService {
    /**
     * Upload a new file to Cloudinary
     */
    async uploadFile(
        file: Express.Multer.File,
        userId: string,
        projectId: string,
        taskId?: string,
        commentId?: string
    ) {
        const isRealProject = projectId && projectId !== 'profile-avatars';
        const dbProjectId = isRealProject ? projectId : null;

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(file.buffer, {
            folder: isRealProject ? `projects/${projectId}` : 'general',
            resourceType: 'auto'
        });

        // Create File Record
        const newFile = await prisma.file.create({
            data: {
                name: file.originalname,
                mimeType: file.mimetype,
                size: cloudinaryResult.bytes,
                url: cloudinaryResult.secure_url, // Cloudinary URL
                projectId: dbProjectId,
                taskId: taskId || null,
                createdById: userId,
                versions: {
                    create: {
                        version: 1,
                        name: file.originalname,
                        mimeType: file.mimetype,
                        size: cloudinaryResult.bytes,
                        url: cloudinaryResult.secure_url,
                        createdById: userId
                    }
                }
            },
            include: {
                versions: true
            }
        });

        // Create initial link
        if (isRealProject || taskId || commentId) {
            await this.createFileLink(newFile.id, { taskId, commentId, projectId: dbProjectId || undefined });
        }

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
        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(file.buffer, {
            folder: 'file-versions',
            resourceType: 'auto'
        });

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
                    size: cloudinaryResult.bytes,
                    url: cloudinaryResult.secure_url,
                    createdById: userId
                }
            }),
            prisma.file.update({
                where: { id: fileId },
                data: {
                    name: file.originalname,
                    mimeType: file.mimetype,
                    size: cloudinaryResult.bytes,
                    url: cloudinaryResult.secure_url,
                    updatedAt: new Date()
                }
            })
        ]);

        return updatedFile[1];
    }

    /**
     * Link an existing file to a new entity (Task, Comment, etc.)
     */
    async createFileLink(fileId: string, context: { taskId?: string, commentId?: string, projectId?: string }) {
        if (context.taskId) {
            const exists = await prisma.fileLink.findFirst({
                where: { fileId, taskId: context.taskId }
            });
            if (exists) return exists;
            return prisma.fileLink.create({
                data: { fileId, taskId: context.taskId }
            });
        }

        if (context.commentId) {
            const exists = await prisma.fileLink.findFirst({
                where: { fileId, commentId: context.commentId }
            });
            if (exists) return exists;
            return prisma.fileLink.create({
                data: { fileId, commentId: context.commentId }
            });
        }

        if (context.projectId) {
            const file = await prisma.file.findUnique({ where: { id: fileId } });
            if (file?.projectId === context.projectId) return;

            return prisma.fileLink.create({
                data: { fileId, projectId: context.projectId }
            });
        }
    }

    async getProjectFiles(projectId: string) {
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

        const exists = await prisma.fileLink.findFirst({
            where: { fileId, ...data }
        });

        if (exists) return exists;

        return prisma.fileLink.create({
            data
        });
    }

    async deleteFile(fileId: string) {
        const file = await prisma.file.findUnique({
            where: { id: fileId },
            include: { versions: true }
        });

        if (!file) return;

        // Delete from Cloudinary
        // Extract public_id from URL if needed
        // Format: https://res.cloudinary.com/cloud_name/resource_type/upload/v123456/public_id.ext
        try {
            // Simple URL parsing - adjust based on your URLs
            const urlParts = file.url.split('/');
            const fileWithExt = urlParts[urlParts.length - 1];
            const publicId = fileWithExt.split('.')[0]; // Remove extension

            // Delete main file
            await deleteFromCloudinary(publicId);

            // Delete versions
            for (const version of file.versions) {
                const versionParts = version.url.split('/');
                const versionFile = versionParts[versionParts.length - 1];
                const versionPublicId = versionFile.split('.')[0];
                await deleteFromCloudinary(versionPublicId);
            }
        } catch (e) {
            console.error("Failed to cleanup files from Cloudinary", e);
        }

        // Delete from DB
        await prisma.file.delete({ where: { id: fileId } });
    }
}

export default new FileService();
