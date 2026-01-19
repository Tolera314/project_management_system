
import { Router } from 'express';
import { createWorkspace, getUserWorkspace, getUserWorkspaces, inviteToWorkspace, removeWorkspaceMember, getWorkspaceMembers, getWorkspaceRoles, updateWorkspaceMemberRole, migrateRoles } from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createWorkspace);
router.get('/me', authMiddleware, getUserWorkspace);
router.get('/list', authMiddleware, getUserWorkspaces);
router.post('/:id/invitations', authMiddleware, inviteToWorkspace);
router.delete('/:id/members/:memberId', authMiddleware, removeWorkspaceMember);
router.patch('/:id/members/:memberId', authMiddleware, updateWorkspaceMemberRole);
router.get('/:id/members', authMiddleware, getWorkspaceMembers);
router.get('/:id/roles', authMiddleware, getWorkspaceRoles);
router.post('/migrate-roles', authMiddleware, migrateRoles);

export default router;
