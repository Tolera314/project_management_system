import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createTagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
    organizationId: z.string().cuid(),
});

export const getOrganizationTags = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const tags = await prisma.tag.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' }
        });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createTag = async (req: Request, res: Response) => {
    try {
        const validation = createTagSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const tag = await prisma.tag.create({
            data: validation.data
        });
        res.status(201).json(tag);
    } catch (error) {
        if ((error as any).code === 'P2002') {
            res.status(400).json({ error: 'Tag with this name already exists in the organization' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.tag.delete({ where: { id } });
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const attachTagToTask = async (req: Request, res: Response) => {
    try {
        const { taskId, tagId } = req.body;
        const taskTag = await prisma.taskTag.create({
            data: { taskId, tagId }
        });
        res.status(201).json(taskTag);
    } catch (error) {
        if ((error as any).code === 'P2002') {
            res.status(400).json({ error: 'Tag already attached to task' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const detachTagFromTask = async (req: Request, res: Response) => {
    try {
        const { taskId, tagId } = req.params;
        await prisma.taskTag.delete({
            where: {
                taskId_tagId: { taskId, tagId }
            }
        });
        res.json({ message: 'Tag detached from task' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
