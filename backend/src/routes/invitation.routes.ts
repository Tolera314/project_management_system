import { Router } from 'express';
import { verifyInvitation, acceptInvitation } from '../controllers/invitation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public route to verify invitation token
router.get('/verify/:token', verifyInvitation);

// Protected route to accept invitation (requires auth)
router.post('/accept/:token', authMiddleware, acceptInvitation);

export default router;
