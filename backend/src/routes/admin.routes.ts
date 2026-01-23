
import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as adminRolesController from '../controllers/admin-roles.controller';
import * as adminAnalyticsController from '../controllers/admin-analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Base route: /admin
router.get('/stats', authMiddleware, getOverviewStats);
router.get('/workspaces', authMiddleware, getWorkspaces);
router.get('/workspaces/:id', authMiddleware, getWorkspaceDetail);
router.patch('/workspaces/:id/status', authMiddleware, updateWorkspaceStatus);

router.get('/users', authMiddleware, getUsers);
router.post('/users', authMiddleware, createUser);
router.get('/users/:id', authMiddleware, getUserDetail);
router.patch('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deactivateUser);
router.put('/users/:id/role', authMiddleware, updateUserRole);
router.put('/users/:id/status', authMiddleware, updateUserStatus);
router.get('/users/:id/activity', authMiddleware, getUserActivity);

// Roles & Permissions
router.get('/roles', authMiddleware, adminRolesController.getRoles);
router.post('/roles', authMiddleware, adminRolesController.createRole);
router.patch('/roles/:id/permissions', authMiddleware, adminRolesController.updateRolePermissions);
router.get('/permissions', authMiddleware, adminRolesController.getAllPermissions);

// Audit Logs
router.get('/audit-logs', authMiddleware, getGlobalAuditLogs);
router.get('/server/status', authMiddleware, getServerStatus);
router.get('/server/logs', authMiddleware, getServerLogs);
router.post('/cache/clear', authMiddleware, clearCache);
router.get('/license', authMiddleware, getLicenseInfo);
router.put('/license', authMiddleware, updateLicense);
router.get('/storage/stats', authMiddleware, getStorageStats);

// Analytics
router.get('/stats/platform', authMiddleware, adminAnalyticsController.getPlatformStats);

export default router;
