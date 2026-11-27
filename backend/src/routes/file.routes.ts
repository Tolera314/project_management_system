
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fileController from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAllowedMimeTypes, ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from '../lib/file-validator';

const router = Router();

// Configure Multer for Project Files (25MB, all allowed types)
const uploadProjectFile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: FILE_SIZE_LIMITS.PROJECT_FILE }, // 25MB
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
        const allowedMimes = getAllowedMimeTypes();

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}. Allowed types: images, PDFs, Office documents, CSV, JSON, archives.`));
        }
    }
});

// Configure Multer for Profile Photos (10MB, images only)
const uploadAvatar = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: FILE_SIZE_LIMITS.AVATAR }, // 10MB
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
        const allowedMimes = ALLOWED_FILE_TYPES.IMAGES;

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile photos (JPEG, PNG, GIF, WebP).'));
        }
    }
});

// Routes - Use uploadProjectFile for project/task files
router.post('/upload', authMiddleware, uploadProjectFile.single('file'), fileController.uploadFile);
router.get('/:id', authMiddleware, fileController.getFileDetails);
router.get('/:id/download', authMiddleware, fileController.downloadFile);
router.post('/:id/version', authMiddleware, uploadProjectFile.single('file'), fileController.uploadVersion);
router.get('/:id/versions', authMiddleware, fileController.getFileVersions);
router.delete('/:id', authMiddleware, fileController.deleteFile);
router.post('/:id/links', authMiddleware, fileController.linkFile);
router.get('/:id/links', authMiddleware, fileController.getFileLinks);
router.get('/project/:projectId', authMiddleware, fileController.getProjectFiles);
router.get('/serve/:filename', fileController.serveFile);

// Export both upload configurations for use in other routes
export { uploadAvatar, uploadProjectFile };
export default router;
