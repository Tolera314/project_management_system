import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    avatarUrl: z.string().optional().or(z.literal('')),
});

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
    securityEmail: z.boolean().optional(),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                systemRole: true,
                status: true,
                notificationPreference: true,
                createdAt: true,
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = updateProfileSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: validation.data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
            }
        });

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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
                ...validation.data,
                userId,
            }
        });

        res.json({ message: 'Preferences updated successfully', preference });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = changePasswordSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { oldPassword, newPassword } = validation.data;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ error: 'Invalid old password' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordVersion: { increment: 1 }
            }
        });

        // Revoke all sessions on password change
        await prisma.session.deleteMany({ where: { userId } });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const sessions = await prisma.session.findMany({
            where: { userId },
            orderBy: { lastActive: 'desc' },
            select: {
                id: true,
                userAgent: true,
                ipAddress: true,
                lastActive: true,
                createdAt: true,
            }
        });

        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const revokeSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { sessionId } = req.params;

        await prisma.session.delete({
            where: {
                id: sessionId,
                userId // Ensure user owns the session
            }
        });

        res.json({ message: 'Session revoked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const revokeAllSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const currentToken = req.headers.authorization?.split(' ')[1];

        await prisma.session.deleteMany({
            where: {
                userId,
                token: { not: currentToken }
            }
        });

        res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
