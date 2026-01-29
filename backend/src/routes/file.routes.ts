
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fileController from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();


// Configure Multer for Cloudinary (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', authMiddleware, upload.single('file'), fileController.uploadFile);
router.get('/:id', authMiddleware, fileController.getFileDetails);
router.get('/:id/download', authMiddleware, fileController.downloadFile);
router.post('/:id/version', authMiddleware, upload.single('file'), fileController.uploadVersion);
router.get('/:id/versions', authMiddleware, fileController.getFileVersions);
router.delete('/:id', authMiddleware, fileController.deleteFile);
router.post('/:id/links', authMiddleware, fileController.linkFile);
router.get('/:id/links', authMiddleware, fileController.getFileLinks);
router.get('/project/:projectId', authMiddleware, fileController.getProjectFiles);
router.get('/serve/:filename', fileController.serveFile);
// Public or Auth? Ideally Auth.

export default router;
