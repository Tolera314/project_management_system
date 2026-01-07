import { Router } from 'express';
import { createProject, getProjects, getProjectDetails, addMember, removeMember, updateMemberRole } from '../controllers/project.controller';
import { convertProjectToTemplate } from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectDetails);

// Member Management
router.post('/:id/members', checkProjectPermission('manage_project_members'), addMember);
router.patch('/:id/members/:memberId/role', checkProjectPermission('manage_project_members'), updateMemberRole);
router.delete('/:id/members/:memberId', checkProjectPermission('manage_project_members'), removeMember);

// Template Management
router.post('/:id/convert-to-template', convertProjectToTemplate);

export default router;
