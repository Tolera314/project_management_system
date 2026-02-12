import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { sendEmail } from '../lib/email'; // Will update this lib next

export const getSettings = async (req: Request, res: Response) => {
    try {
        const { group } = req.query;
        const userId = (req as any).userId;

        // Ensure System Admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const settings = await prisma.systemSetting.findMany({
            where: group ? { group: String(group) } : undefined
        });

        // Transform to key-value object map
        const settingsMap = settings.reduce((acc: Record<string, any>, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);

        res.json(settingsMap);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateSettingsSchema = z.object({
    group: z.string(),
    settings: z.record(z.string(), z.any())
});

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const validation = updateSettingsSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.message });
            return;
        }

        const { group, settings } = validation.data;

        // Upsert each setting
        await prisma.$transaction(
            Object.entries(settings).map(([key, value]) =>
                prisma.systemSetting.upsert({
                    where: { group_key: { group, key } },
                    create: { group, key, value: value as any },
                    update: { value: value as any }
                })
            )
        );

        // Audit Log (simplified)
        await prisma.adminAuditLog.create({
            data: {
                action: 'SETTINGS_UPDATED',
                entityType: 'SYSTEM',
                performedById: userId,
                metadata: { group, keys: Object.keys(settings) }
            }
        });

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const triggerBackup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Simulate backup
        const filename = `backup-${new Date().toISOString().split('T')[0]}.sql`;
        const size = Math.floor(Math.random() * 1000000) + 500000; // Random size ~1MB

        const backup = await prisma.systemBackup.create({
            data: {
                filename,
                path: '/backups/' + filename,
                sizeBytes: size,
                createdBy: { connect: { id: userId } }
            }
        });

        await prisma.adminAuditLog.create({
            data: {
                action: 'BACKUP_CREATED',
                entityType: 'SYSTEM',
                performedById: userId,
                metadata: { backupId: backup.id }
            }
        });

        res.json({
            ...backup,
            sizeBytes: Number(backup.sizeBytes) // Convert BigInt to Number
        });
    } catch (error) {
        console.error('Trigger backup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBackups = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const backups = await prisma.systemBackup.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Convert BigInt to Number for JSON serialization
        const serializedBackups = backups.map((b: any) => ({
            ...b,
            sizeBytes: Number(b.sizeBytes)
        }));

        res.json(serializedBackups);
    } catch (error) {
        console.error('Get backups error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const testEmail = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        await sendEmail({
            to: email,
            subject: 'Test Email from ProjectOS',
            html: '<p>This is a test email to verify your SMTP settings.</p>'
        });

        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ error: 'Failed to send test email. Check server logs.' });
    }
};
