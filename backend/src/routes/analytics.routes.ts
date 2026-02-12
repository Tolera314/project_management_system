import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getUserAnalytics } from '../controllers/report.controller';

const router = Router();

router.use(authMiddleware);

router.get('/user/:id', getUserAnalytics);

export default router;
