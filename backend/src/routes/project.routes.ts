import { Router } from 'express';
import { createProject, getProjects, getProjectDetails, addMember, removeMember } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectDetails);

// Member Management
router.post('/:id/members', checkProjectPermission('manage_members'), addMember);
router.delete('/:id/members/:memberId', checkProjectPermission('manage_members'), removeMember);

export default router;
