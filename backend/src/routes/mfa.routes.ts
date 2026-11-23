import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { setupMFA, verifyMFASetup, verifyMFA, disableMFA, getMFAStatus } from '../controllers/mfa.controller';

const router = Router();

// All routes except /verify require authentication (called after credentials check)
router.get('/status', authenticate, getMFAStatus);
router.get('/setup', authenticate, setupMFA);
router.post('/verify-setup', authenticate, verifyMFASetup);
router.post('/verify', verifyMFA);           // No auth middleware — called with pending userId
router.delete('/disable', authenticate, disableMFA);

export default router;
