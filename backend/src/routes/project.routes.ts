import { Router } from 'express';
import { createProject, getProjects, getProjectDetails, addMember, removeMember, updateMemberRole, getProjectStats, getTemplates } from '../controllers/project.controller';
import { getProjectReport } from '../controllers/report.controller';
import { convertProjectToTemplate } from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/templates', getTemplates);
router.get('/:id', getProjectDetails);
router.get('/:id/stats', getProjectStats);
router.get('/:id/report', checkProjectPermission('view_reports'), getProjectReport);

// Member Management
router.post('/:id/members', checkProjectPermission('manage_project_members'), addMember);
router.patch('/:id/members/:memberId/role', checkProjectPermission('manage_project_members'), updateMemberRole);
router.delete('/:id/members/:memberId', checkProjectPermission('manage_project_members'), removeMember);

// Template Management
router.post('/:id/convert-to-template', convertProjectToTemplate);

export default router;
