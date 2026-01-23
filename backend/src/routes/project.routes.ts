import { Router } from 'express';
import { createProject, getProjects, getProjectDetails, addMember, removeMember, updateMemberRole, getProjectStats, getTemplates, updateProject, deleteProject } from '../controllers/project.controller';
import { getProjectReport } from '../controllers/report.controller';
import { convertProjectToTemplate } from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.post('/', authMiddleware, createProject);
router.get('/', authMiddleware, getProjects);
router.get('/templates', authMiddleware, getTemplates);
router.get('/:id', authMiddleware, getProjectDetails);
router.put('/:id', authMiddleware, updateProject);
router.delete('/:id', authMiddleware, deleteProject);
router.get('/:id/stats', authMiddleware, getProjectStats);
router.get('/:id/report', authMiddleware, checkProjectPermission('view_reports'), getProjectReport);

// Member Management
router.post('/:id/members', authMiddleware, checkProjectPermission('manage_project_members'), addMember);
router.patch('/:id/members/:memberId/role', authMiddleware, checkProjectPermission('manage_project_members'), updateMemberRole);
router.delete('/:id/members/:memberId', authMiddleware, checkProjectPermission('manage_project_members'), removeMember);

// Template Management
router.post('/:id/convert-to-template', authMiddleware, convertProjectToTemplate);

export default router;
