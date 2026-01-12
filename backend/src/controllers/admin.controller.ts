
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SystemRole } from '@prisma/client';

export const getOverviewStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.systemRole !== SystemRole.SYSTEM_ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Parallel stats fetching
        const [
            totalUsers,
            totalWorkspaces,
            totalProjects,
            activeUsersLast7Days
        ] = await Promise.all([
            prisma.user.count(),
            prisma.organization.count(),
            prisma.project.count(),
            prisma.user.count({
                // Placeholder for "Active" - ideally based on last login session
                where: { status: 'ACTIVE' }
            }),
            // Add more stats as needed
        ]);

        const stats = {
            users: { total: totalUsers, active: activeUsersLast7Days, growth: 12 }, // Growth is mock for now or calc simple
            workspaces: { total: totalWorkspaces, growth: 5 },
            projects: { total: totalProjects, active: totalProjects }, // Approximation
            revenue: { total: 0, growth: 0 } // No billing yet
        };

        res.json(stats);
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWorkspaces = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.systemRole !== SystemRole.SYSTEM_ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const { q, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (q) {
            where.name = { contains: String(q), mode: 'insensitive' };
        }

        const workspaces = await prisma.organization.findMany({
            where,
            include: {
                members: {
                    where: { role: { name: 'OWNER' } }, // Assuming 'OWNER' role name exists. If not, we take first member or creator.
                    take: 1,
                    include: { user: true }
                },
                _count: {
                    select: {
                        members: true,
                        projects: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.organization.count({ where });

        // Map to UI friendly format
        const formattedWorkspaces = workspaces.map(w => {
            const ownerMember = w.members[0];
            const ownerName = ownerMember?.user ? `${ownerMember.user.firstName} ${ownerMember.user.lastName}` : 'Unknown';

            return {
                id: w.id,
                name: w.name,
                owner: ownerName,
                plan: 'PRO', // Mock
                members: w._count.members,
                projects: w._count.projects,
                createdAt: w.createdAt,
                status: 'ACTIVE'
            };
        });

        res.json({
            workspaces: formattedWorkspaces,
            metadata: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error('Get admin workspaces error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
