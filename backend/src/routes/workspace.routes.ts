
import { Router } from 'express';
import { createWorkspace, getUserWorkspace } from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createWorkspace);
router.get('/me', authMiddleware, getUserWorkspace);

export default router;
