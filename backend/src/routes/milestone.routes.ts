import { Router } from 'express';
import {
    createMilestone,
    getMilestones,
    updateMilestone,
    deleteMilestone
} from '../controllers/milestone.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All milestone routes require authentication
router.use(authMiddleware);

router.post('/', createMilestone);
router.get('/', getMilestones);
router.patch('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

export default router;
