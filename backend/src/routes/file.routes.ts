
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fileController from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// Routes
router.post('/upload', authMiddleware, upload.single('file'), fileController.uploadFile);
router.get('/:id', authMiddleware, fileController.getFileDetails);
router.get('/:id/download', authMiddleware, fileController.serveFile);
router.post('/:id/version', authMiddleware, upload.single('file'), fileController.uploadVersion);
router.get('/:id/versions', authMiddleware, fileController.getFileVersions);
router.delete('/:id', authMiddleware, fileController.deleteFile);
router.post('/:id/links', authMiddleware, fileController.linkFile);
router.get('/:id/links', authMiddleware, fileController.getFileLinks);
router.get('/project/:projectId', authMiddleware, fileController.getProjectFiles);
router.get('/serve/:filename', fileController.serveFile);
// Public or Auth? Ideally Auth.

export default router;
