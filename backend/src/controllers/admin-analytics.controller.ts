
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SystemRole } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export const getPlatformStats = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });

        if (!adminUser || adminUser.systemRole !== SystemRole.SYSTEM_ADMIN) {
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

        // 2. Growth Trends (Last 30 days)
        const last30Days = Array.from({ length: 30 }).map((_, i) => {
            const date = subDays(new Date(), i);
            return format(date, 'yyyy-MM-dd');
        }).reverse();

        // This is heavy, ideally cached or pre-aggregated. For now, simple count by date.
        // In real world, we'd query and group.
        const userGrowth = await prisma.user.groupBy({
            by: ['createdAt'],
            _count: true,
            where: {
                createdAt: { gte: subDays(new Date(), 30) }
            }
        });

        // Format for recharts
        const growthData = last30Days.map(date => ({
            date: format(new Date(date), 'MMM dd'),
            users: Math.floor(Math.random() * 10) + 1, // Placeholder for real aggregation
            workspaces: Math.floor(Math.random() * 5)
        }));

        // 3. Storage Usage (Mock for now)
        const storageUsage = [
            { name: 'Images', value: 45 },
            { name: 'Documents', value: 30 },
            { name: 'Videos', value: 15 },
            { name: 'Others', value: 10 }
        ];

        // 4. Workspace Insights
        const workspaceInsights = await prisma.organization.findMany({
            take: 5,
            include: {
                _count: { select: { members: true, projects: true } }
            },
            orderBy: { members: { _count: 'desc' } }
        });

        res.json({
            kpis: {
                totalUsers,
                activeUsers,
                totalWorkspaces,
                totalProjects,
                totalTasks,
                mfaRate: Math.round((mfaUsers / totalUsers) * 100) || 0
            },
            growthData,
            storageUsage,
            workspaceInsights: workspaceInsights.map(w => ({
                id: w.id,
                name: w.name,
                members: w._count.members,
                projects: w._count.projects,
                activityScore: Math.floor(Math.random() * 100)
            }))
        });
    } catch (error) {
        console.error('Get platform stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
