import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createMilestoneSchema = z.object({
    name: z.string().min(1, 'Milestone name is required').max(100),
    description: z.string().optional(),
    dueDate: z.string().transform(v => new Date(v)),
    projectId: z.string().cuid(),
    ownerId: z.string().cuid().optional(),
    taskIds: z.array(z.string().cuid()).optional(),
});

const updateMilestoneSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
    ownerId: z.string().cuid().optional(),
    taskIds: z.array(z.string().cuid()).optional(),
});

export const createMilestone = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = createMilestoneSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, description, dueDate, projectId, ownerId, taskIds } = validation.data;

        // Verify project exists and user has access
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization: {
                    members: { some: { userId } }
                }
            }
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }

        // Validate Due Date against Project Start/End (if they exist)
        if (project.startDate && dueDate < project.startDate) {
            res.status(400).json({ error: 'Milestone due date cannot be before project start date' });
            return;
        }

        const milestone = await prisma.milestone.create({
            data: {
                name,
                description,
                dueDate,
                projectId,
                createdById: userId,
                ownerId,
                tasks: taskIds ? {
                    connect: taskIds.map(id => ({ id }))
                } : undefined
            },
            include: {
                tasks: {
                    select: { id: true, status: true }
                },
                owner: {
                    include: {
                        organizationMember: {
                            include: { user: { select: { firstName: true, lastName: true } } }
                        }
                    }
                }
            }
        });

        res.status(201).json({ milestone });
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMilestones = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;
        const userId = (req as any).userId;

        if (!projectId || typeof projectId !== 'string') {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        const milestones = await prisma.milestone.findMany({
            where: {
                projectId,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            },
            include: {
                tasks: {
                    select: { id: true, status: true, dueDate: true }
                },
                owner: {
                    include: {
                        organizationMember: {
                            include: { user: { select: { firstName: true, lastName: true } } }
                        }
                    }
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Calculate Derived Status and Progress for each milestone
        const today = new Date();
        const enrichedMilestones = milestones.map(m => {
            const totalTasks = m.tasks.length;
            const completedTasks = m.tasks.filter(t => t.status === 'DONE').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let status = 'ON_TRACK';

            if (totalTasks > 0 && completedTasks === totalTasks) {
                status = 'COMPLETED';
            } else if (m.dueDate < today) {
                status = 'OVERDUE';
            } else {
                // At Risk if some tasks are overdue OR if due date is near and many tasks are left
                const delayedTasks = m.tasks.filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate < today).length;
                const daysToDue = (m.dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

                if (delayedTasks > 0 || (daysToDue < 3 && progress < 80)) {
                    status = 'AT_RISK';
                }
            }

            return {
                ...m,
                progress,
                status,
                taskCount: totalTasks,
                completedTaskCount: completedTasks
            };
        });

        res.json({ milestones: enrichedMilestones });
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateMilestone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;
        const validation = updateMilestoneSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const milestone = await prisma.milestone.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            }
        });

        if (!milestone) {
            res.status(404).json({ error: 'Milestone not found or access denied' });
            return;
        }

        const { name, description, dueDate, ownerId, taskIds } = validation.data;

        const updatedMilestone = await prisma.milestone.update({
            where: { id },
            data: {
                name,
                description,
                dueDate,
                ownerId,
                tasks: taskIds ? {
                    set: taskIds.map(taskId => ({ id: taskId }))
                } : undefined
            },
            include: {
                tasks: true,
                owner: true
            }
        });

        res.json({ milestone: updatedMilestone });
    } catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteMilestone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const milestone = await prisma.milestone.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            }
        });

        if (!milestone) {
            res.status(404).json({ error: 'Milestone not found or access denied' });
            return;
        }

        await prisma.milestone.delete({ where: { id } });
        res.json({ message: 'Milestone deleted successfully' });
    } catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
