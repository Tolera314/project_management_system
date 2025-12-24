
import { Router } from 'express';
import { createProject, getProjects } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AuthUser } from '../types/auth.types';

const router = Router();

// All project routes require authentication
// Apply authentication middleware to all routes
router.use((req, res, next) => {
  return authenticate(req, res, next);
});

router.post('/', createProject);
router.get('/', getProjects);

export default router;
