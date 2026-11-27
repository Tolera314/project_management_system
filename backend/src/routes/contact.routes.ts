import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.controller';
import { apiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Apply rate limiting to prevent spam
router.post('/contact', apiLimiter, submitContactForm);

export default router;
