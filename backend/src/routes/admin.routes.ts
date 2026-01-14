
import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as adminRolesController from '../controllers/admin-roles.controller';
import * as adminAnalyticsController from '../controllers/admin-analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Base route: /admin
router.get('/stats', authMiddleware, adminController.getOverviewStats);
router.get('/workspaces', authMiddleware, adminController.getWorkspaces);
router.get('/workspaces/:id', authMiddleware, adminController.getWorkspaceDetail);
router.patch('/workspaces/:id/status', authMiddleware, adminController.updateWorkspaceStatus);

router.get('/users', authMiddleware, adminController.getUsers);
router.patch('/users/:id', authMiddleware, adminController.updateUser);

// Roles & Permissions
router.get('/roles', authMiddleware, adminRolesController.getRoles);
router.post('/roles', authMiddleware, adminRolesController.createRole);
router.patch('/roles/:id/permissions', authMiddleware, adminRolesController.updateRolePermissions);
router.get('/permissions', authMiddleware, adminRolesController.getAllPermissions);

// Audit Logs
router.get('/audit-logs', authMiddleware, adminController.getGlobalAuditLogs);

// Analytics
router.get('/stats/platform', authMiddleware, adminAnalyticsController.getPlatformStats);

export default router;
