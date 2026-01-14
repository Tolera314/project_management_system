
import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireSystemAdmin } from '../middleware/permissions';

const router = Router();

// All admin routes require authentication and system admin role
const adminAuth = [authMiddleware, requireSystemAdmin];

// Dashboard stats
router.get('/stats', adminAuth, adminController.getOverviewStats);
router.get('/workspaces', adminAuth, adminController.getWorkspaces);

// User Management
router.get('/users', adminAuth, adminController.getUsers);
router.get('/users/:userId', adminAuth, adminController.getUserDetail);
router.put('/users/:userId/role', adminAuth, adminController.updateUserRole);
router.put('/users/:userId/status', adminAuth, adminController.updateUserStatus);
router.post('/users/:userId/force-logout', adminAuth, adminController.forceLogoutUser);
router.post('/users/:userId/reset-password', adminAuth, adminController.resetUserPassword);
router.put('/users/:userId/mfa', adminAuth, adminController.toggleUserMFA);
router.delete('/users/:userId/workspaces/:organizationId', adminAuth, adminController.removeUserFromWorkspace);
router.get('/users/:userId/audit', adminAuth, adminController.getUserAuditHistory);
router.delete('/users/:userId', adminAuth, adminController.deleteUser);

export default router;
