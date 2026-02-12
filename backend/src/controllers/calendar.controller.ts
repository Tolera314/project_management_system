import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCalendarTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { organizationId, start, end } = req.query;

        const tasks = await prisma.task.findMany({
            where: {
                project: {
                    organizationId: organizationId as string,
                    organization: { members: { some: { userId } } }
                },
                OR: [
                    { startDate: { gte: new Date(start as string), lte: new Date(end as string) } },
                    { dueDate: { gte: new Date(start as string), lte: new Date(end as string) } }
                ]
            },
            include: {
                project: { select: { name: true, color: true } }
            }
        });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCalendarMilestones = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { organizationId, start, end } = req.query;

        const milestones = await prisma.milestone.findMany({
            where: {
                project: {
                    organizationId: organizationId as string,
                    organization: { members: { some: { userId } } }
                },
                dueDate: { gte: new Date(start as string), lte: new Date(end as string) }
            },
            include: {
                project: { select: { name: true, color: true } }
            }
        });

        res.json(milestones);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const generateCalendarSyncUrl = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // In a real app, generate a unique token for the user
        const token = Buffer.from(`${userId}:${organizationId}`).toString('base64');
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const syncUrl = `${baseUrl}/api/calendar/feed/${token}.ics`;

        res.json({ syncUrl });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
