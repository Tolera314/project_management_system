
import { Router } from 'express';
import { createWorkspace, getUserWorkspace, inviteToWorkspace } from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createWorkspace);
router.get('/me', authMiddleware, getUserWorkspace);
router.post('/:id/invitations', authMiddleware, inviteToWorkspace);

export default router;
