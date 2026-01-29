
import { Router } from 'express';
import { createWorkspace, getUserWorkspace, getUserWorkspaces, getWorkspaceMembers, updateWorkspaceMemberRole, migrateRoles, getWorkspacePermissions, updateWorkspaceRolePermissions, getWorkspaceById, updateWorkspace, deleteWorkspace, joinWorkspace, getWorkspaceRoles, createWorkspaceRole, updateWorkspaceRole, deleteWorkspaceRole, inviteToWorkspace, removeWorkspaceMember } from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createWorkspace);
router.get('/me', authMiddleware, getUserWorkspace);
router.get('/list', authMiddleware, getUserWorkspaces);
router.get('/:id', authMiddleware, getWorkspaceById);
router.put('/:id', authMiddleware, updateWorkspace);
router.delete('/:id', authMiddleware, deleteWorkspace);
router.post('/:id/invitations', authMiddleware, inviteToWorkspace);
router.post('/join/:token', authMiddleware, joinWorkspace);
router.delete('/:id/members/:memberId', authMiddleware, removeWorkspaceMember);
router.patch('/:id/members/:memberId', authMiddleware, updateWorkspaceMemberRole);
router.get('/:id/members', authMiddleware, getWorkspaceMembers);
router.get('/:id/roles', authMiddleware, getWorkspaceRoles);
router.post('/:id/roles', authMiddleware, createWorkspaceRole);
router.put('/:id/roles/:roleId', authMiddleware, updateWorkspaceRole);
router.delete('/:id/roles/:roleId', authMiddleware, deleteWorkspaceRole);
router.post('/migrate-roles', authMiddleware, migrateRoles);
router.get('/permissions/list', authMiddleware, getWorkspacePermissions);
router.patch('/:id/roles/:roleId/permissions', authMiddleware, updateWorkspaceRolePermissions);

export default router;
