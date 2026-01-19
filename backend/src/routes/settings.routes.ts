import { Router } from 'express';
import { getSettings, updateSettings, triggerBackup, getBackups, testEmail } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require System Admin authorization (checked in controller)
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/backup', triggerBackup);
router.get('/backups', getBackups);
router.post('/test-email', testEmail);

export default router;
