
import { Router } from 'express';
import { register, login, logout, refreshToken, forgotPassword, resetPassword, verifyMFA, getSession, googleLogin, googleCallback } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/mfa/verify', verifyMFA);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.get('/session', authMiddleware, getSession);

export default router;
