
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
router.post('/workspaces/provision', authMiddleware, adminController.provisionWorkspace);

router.get('/alerts', authMiddleware, adminController.getActiveAlerts);
router.post('/alerts/:id/acknowledge', authMiddleware, adminController.acknowledgeAlert);

router.get('/notifications', authMiddleware, adminController.getNotifications);
router.post('/notifications/:id/read', authMiddleware, adminController.markNotificationAsRead);

router.get('/users', authMiddleware, adminController.getUsers);
router.post('/users', authMiddleware, adminController.createUser);
router.get('/users/:id', authMiddleware, adminController.getUserDetail);
router.patch('/users/:id', authMiddleware, adminController.updateUser);
router.delete('/users/:id', authMiddleware, adminController.deactivateUser);
router.put('/users/:id/role', authMiddleware, adminController.updateUserRole);
router.put('/users/:id/status', authMiddleware, adminController.updateUserStatus);
router.get('/users/:id/activity', authMiddleware, adminController.getUserActivity);

// Roles & Permissions
router.get('/roles', authMiddleware, adminRolesController.getRoles);
router.post('/roles', authMiddleware, adminRolesController.createRole);
router.patch('/roles/:id/permissions', authMiddleware, adminRolesController.updateRolePermissions);
router.get('/permissions', authMiddleware, adminRolesController.getAllPermissions);

// Audit Logs
router.get('/audit-logs', authMiddleware, adminController.getGlobalAuditLogs);
router.get('/server/status', authMiddleware, adminController.getServerStatus);
router.get('/server/logs', authMiddleware, adminController.getServerLogs);
router.post('/cache/clear', authMiddleware, adminController.clearCache);
router.get('/license', authMiddleware, adminController.getLicenseInfo);
router.put('/license', authMiddleware, adminController.updateLicense);
router.get('/storage/stats', authMiddleware, adminController.getStorageStats);

// Analytics
router.get('/stats/platform', authMiddleware, adminAnalyticsController.getPlatformStats);

export default router;
