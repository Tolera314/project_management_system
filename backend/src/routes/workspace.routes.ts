
import { Router } from 'express';
import { createWorkspace, getUserWorkspace } from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createWorkspace);
router.get('/me', authenticate, getUserWorkspace);

export default router;
