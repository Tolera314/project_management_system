import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, notificationController.getNotifications);
router.patch('/mark-all-read', authMiddleware, notificationController.markAllAsRead);
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);
router.get('/preferences', authMiddleware, notificationController.getPreferences);
router.patch('/preferences', authMiddleware, notificationController.updatePreferences);

export default router;
