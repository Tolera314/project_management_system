import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { SystemRole } from '@prisma/client';

// Middleware to check if user is a system admin
export const requireSystemAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            select: { systemRole: true, status: true }
        });

        if (!user || user.systemRole !== SystemRole.SYSTEM_ADMIN) {
            res.status(403).json({ error: 'System admin access required' });
            return;
        }

        if (user.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Account is not active' });
            return;
        }

        next();
    } catch (error) {
        console.error('System admin check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const checkProjectPermission = (permissionName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).userId;
            let projectId = req.params.projectId || req.body.projectId;

            // If not found, check if req.params.id is project ID or task ID
            if (!projectId && req.params.id) {
                // If the path includes /tasks/, then req.params.id is likely a taskId
                if (req.originalUrl.includes('/tasks/')) {
                    const task = await prisma.task.findUnique({
                        where: { id: req.params.id },
                        select: { projectId: true }
                    });
                    if (task) {
                        projectId = task.projectId;
                    } else {
                        // Fallback to params.id if not found as task
                        projectId = req.params.id;
                    }
                } else {
                    projectId = req.params.id;
                }
            }

            if (!projectId) {
                res.status(400).json({ error: 'Project ID required' });
                return;
            }

            // 1. Check Project Membership
            const projectMember = await prisma.projectMember.findFirst({
                where: { projectId, organizationMember: { userId } },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            });

            // 2. Check if role has specific permission
            if (projectMember) {
                const hasPermission = projectMember.role.permissions.some(
                    rp => rp.permission.name === permissionName
                );

                // Allow if Project Manager (Super user for project)
                // Assuming 'Project Manager' role name or specific logic
                if (projectMember.role.name === 'Project Manager' || hasPermission) {
                    next();
                    return;
                }
            }

            // 3. Optional: Check Workspace Admin (Cascading permissions)
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { organizationId: true }
            });

            if (project) {
                const orgMember = await prisma.organizationMember.findUnique({
                    where: {
                        organizationId_userId: {
                            organizationId: project.organizationId,
                            userId
                        }
                    },
                    include: { role: true }
                });

                if (orgMember && (orgMember.role.name === 'Owner' || orgMember.role.name === 'Admin')) {
                    next(); // Workspace Admins override
                    return;
                }
            }

            res.status(403).json({ error: 'Insufficient permissions' });
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
