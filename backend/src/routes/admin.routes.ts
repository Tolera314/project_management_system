
import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Base route: /admin
router.get('/stats', authMiddleware, adminController.getOverviewStats);
router.get('/workspaces', authMiddleware, adminController.getWorkspaces);

export default router;
