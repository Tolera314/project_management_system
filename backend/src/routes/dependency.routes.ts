import { Router } from 'express';
import {
    createDependency,
    getDependencies,
    deleteDependency
} from '../controllers/dependency.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All dependency routes require authentication
router.use(authMiddleware);

router.post('/', createDependency);
router.get('/:targetId', getDependencies);
router.delete('/:id', deleteDependency);

export default router;
