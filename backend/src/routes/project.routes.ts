
import { Router } from 'express';
import { createProject, getProjects } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All project routes require authentication
router.post('/', authMiddleware, createProject);
router.get('/', authMiddleware, getProjects);

export default router;
