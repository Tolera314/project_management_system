import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                actor: {
                    select: { id: true, firstName: true, lastName: true }
                },
                project: {
                    select: { id: true, name: true }
                },
                task: {
                    select: { id: true, title: true }
                }
            }
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        await prisma.notification.update({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() }
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        let preference = await prisma.notificationPreference.findUnique({
            where: { userId }
        });

        if (!preference) {
            // Create default preferences
            preference = await prisma.notificationPreference.create({
                data: { userId }
            });
        }

        res.json({ preference });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updatePreferencesSchema = z.object({
    taskAssignedInApp: z.boolean().optional(),
    taskAssignedEmail: z.boolean().optional(),
    taskStatusInApp: z.boolean().optional(),
    taskStatusEmail: z.boolean().optional(),
    taskCommentInApp: z.boolean().optional(),
    taskCommentEmail: z.boolean().optional(),
    taskDueInApp: z.boolean().optional(),
    taskDueEmail: z.boolean().optional(),
    projectMemberInApp: z.boolean().optional(),
    projectMemberEmail: z.boolean().optional(),
    projectRoleInApp: z.boolean().optional(),
    projectRoleEmail: z.boolean().optional(),
    milestoneInApp: z.boolean().optional(),
    milestoneEmail: z.boolean().optional(),
    invitationInApp: z.boolean().optional(),
    invitationEmail: z.boolean().optional(),
});

export const updatePreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = updatePreferencesSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const preference = await prisma.notificationPreference.upsert({
            where: { userId },
            update: validation.data,
            create: {
                userId,
                ...validation.data
            }
        });

        res.json({ preference });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
