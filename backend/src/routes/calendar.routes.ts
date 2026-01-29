import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getCalendarTasks, getCalendarMilestones, generateCalendarSyncUrl } from '../controllers/calendar.controller';

const router = Router();

router.use(authMiddleware);

router.get('/tasks', getCalendarTasks);
router.get('/milestones', getCalendarMilestones);
router.get('/sync-url', generateCalendarSyncUrl);

export default router;
