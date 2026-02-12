import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createDependencySchema = z.object({
    sourceId: z.string().cuid(),
    targetId: z.string().cuid(),
    type: z.enum(['PROJECT', 'LIST', 'TASK']),
    dependencyType: z.string().default('FINISH_TO_START'),
});

export const createDependency = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = createDependencySchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { sourceId, targetId, type, dependencyType } = validation.data;

        if (sourceId === targetId) {
            res.status(400).json({ error: 'Source and target cannot be the same' });
            return;
        }

        // Logic split by type
        switch (type) {
            case 'PROJECT':
                await prisma.projectDependency.create({
                    data: { sourceId, targetId, type: dependencyType }
                });
                break;
            case 'LIST':
                await prisma.listDependency.create({
                    data: { sourceId, targetId, type: dependencyType }
                });
                break;
            case 'TASK':
                // Circular dependency check for Tasks
                const checkCycle = async (source: string, target: string): Promise<boolean> => {
                    if (source === target) return true;
                    const deps = await prisma.taskDependency.findMany({
                        where: { sourceId: target }
                    });
                    for (const dep of deps) {
                        if (await checkCycle(source, dep.targetId)) return true;
                    }
                    return false;
                };

                if (await checkCycle(sourceId, targetId)) {
                    res.status(400).json({ error: 'Circular dependency detected' });
                    return;
                }

                await prisma.taskDependency.create({
                    data: { sourceId, targetId, type: dependencyType }
                });
                break;
        }

        res.status(201).json({ message: 'Dependency created successfully' });
    } catch (error) {
        console.error('Create dependency error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteDependency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        switch (type) {
            case 'PROJECT':
                await prisma.projectDependency.delete({ where: { id } });
                break;
            case 'LIST':
                await prisma.listDependency.delete({ where: { id } });
                break;
            case 'TASK':
                await prisma.taskDependency.delete({ where: { id } });
                break;
            default:
                res.status(400).json({ error: 'Invalid dependency type' });
                return;
        }

        res.json({ message: 'Dependency deleted successfully' });
    } catch (error) {
        console.error('Delete dependency error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDependencies = async (req: Request, res: Response) => {
    try {
        const { targetId } = req.params;
        const { type } = req.query;

        let dependencies;
        switch (type) {
            case 'PROJECT':
                dependencies = await prisma.projectDependency.findMany({
                    where: { targetId },
                    include: { source: true }
                });
                break;
            case 'LIST':
                dependencies = await prisma.listDependency.findMany({
                    where: { targetId },
                    include: { source: true }
                });
                break;
            case 'TASK':
                dependencies = await prisma.taskDependency.findMany({
                    where: { targetId },
                    include: { source: true }
                });
                break;
            default:
                res.status(400).json({ error: 'Invalid dependency type' });
                return;
        }

        res.json({ dependencies });
    } catch (error) {
        console.error('Get dependencies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
