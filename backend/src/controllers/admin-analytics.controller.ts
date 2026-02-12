
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SystemRole } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export const getPlatformStats = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });

        if (!adminUser || adminUser.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // 1. KPI Cards
        const [
            totalUsers,
            activeUsers,
            totalWorkspaces,
            totalProjects,
            totalTasks,
            mfaUsers
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.organization.count(),
            prisma.project.count({ where: { isTemplate: false } }),
            prisma.task.count(),
            prisma.user.count({ where: { mfaEnabled: true } })
        ]);

    } catch (error) {
        console.error('Get platform stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
