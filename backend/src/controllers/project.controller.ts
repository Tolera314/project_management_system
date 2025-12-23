import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
    description: z.string().optional(),
    organizationId: z.string().cuid('Invalid organization ID'),
    startDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
    dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('NOT_STARTED'),
    color: z.string().optional(),
    dependencyIds: z.array(z.string().cuid()).optional(),
});

export const createProject = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId; // From auth middleware

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = createProjectSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, description, organizationId, startDate, dueDate, priority, status, color, dependencyIds } = validation.data;

        // Verify user is member of organization
        const membership = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({ error: 'You are not a member of this organization' });
            return;
        }

        // Create project within a transaction to handle dependencies
        const project = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const newProject = await tx.project.create({
                data: {
                    name,
                    description: description || null,
                    organizationId,
                    createdById: userId,
                    updatedById: userId,
                    startDate: startDate || null,
                    dueDate: dueDate || null,
                    priority,
                    status,
                    color: color || '#4F46E5',
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            // Handle dependencies if any
            if (dependencyIds && dependencyIds.length > 0) {
                await tx.projectDependency.createMany({
                    data: dependencyIds.map(depId => ({
                        sourceId: depId,
                        targetId: newProject.id,
                        type: 'FINISH_TO_START'
                    }))
                });
            }

            return newProject;
        });

        res.status(201).json({
            message: 'Project created successfully',
            project,
        });

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { organizationId } = req.query;

        if (!organizationId || typeof organizationId !== 'string') {
            res.status(400).json({ error: 'Organization ID is required' });
            return;
        }

        // Verify membership
        const membership = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                userId,
            },
        });

        if (!membership) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const projects = await prisma.project.findMany({
            where: {
                organizationId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({ projects });

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
