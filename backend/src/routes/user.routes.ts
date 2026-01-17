import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    updatePreferences,
    changePassword,
    getSessions,
    revokeSession,
    revokeAllSessions
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/preferences', updatePreferences);
router.post('/change-password', changePassword);
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);
router.delete('/sessions', revokeAllSessions);

export default router;
