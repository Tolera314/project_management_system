import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { getTaskAssignedEmailTemplate, sendEmail } from '../lib/email';

const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(200),
    description: z.string().optional(),
    projectId: z.string().cuid(),
    listId: z.string().cuid().optional(),
    parentId: z.string().cuid().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
    startDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
    dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
    position: z.number().int().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    listId: z.string().cuid().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
    startDate: z.string().nullable().optional().transform(v => v ? new Date(v) : (v === null ? null : undefined)),
    dueDate: z.string().nullable().optional().transform(v => v ? new Date(v) : (v === null ? null : undefined)),
    position: z.number().int().optional(),
    completedAt: z.string().nullable().optional().transform(v => v ? new Date(v) : (v === null ? null : undefined)),
});

export const createTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = createTaskSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { title, description, projectId, listId, parentId, priority, status, startDate, dueDate, position } = validation.data;

        // Verify user has access to project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization: {
                    members: { some: { userId } }
                }
            }
        });

        if (!project) {
            res.status(403).json({ error: 'Access denied or project not found' });
            return;
        }

        const taskCount = await prisma.task.count({ where: { projectId, listId, parentId } });

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                projectId,
                listId: listId || null,
                parentId: parentId || null,
                priority,
                status,
                startDate: startDate || null,
                dueDate: dueDate || null,
                position: position ?? taskCount,
                createdById: userId,
                updatedById: userId,
            },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, email: true }
                }
            }
        });

        res.status(201).json({ task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;
        const validation = updateTaskSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const task = await prisma.task.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            }
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found or access denied' });
            return;
        }

        const { title, description, listId, priority, status, startDate, dueDate, position, completedAt: providedCompletedAt } = validation.data;

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title,
                description,
                listId,
                priority,
                status,
                startDate,
                dueDate,
                position,
                updatedById: userId,
                completedAt: (status === 'DONE' && task.status !== 'DONE')
                    ? new Date()
                    : (status && status !== 'DONE')
                        ? null
                        : providedCompletedAt,
            }
        });

        res.json({ task: updatedTask });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const task = await prisma.task.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            }
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found or access denied' });
            return;
        }

        await prisma.task.delete({ where: { id } });
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTaskDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const task = await prisma.task.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            },
            include: {
                dependencies: {
                    include: { source: true }
                },
                dependents: {
                    include: { target: true }
                },
                milestone: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                assignees: {
                    include: {
                        projectMember: {
                            include: {
                                organizationMember: {
                                    include: {
                                        user: {
                                            select: { id: true, firstName: true, lastName: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                children: {
                    orderBy: { position: 'asc' }
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        createdBy: {
                            select: { id: true, firstName: true, lastName: true }
                        }
                    }
                },
                activityLogs: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { id: true, firstName: true }
                        }
                    }
                }
            }
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const userId = (req as any).userId;
        const { content, parentId } = req.body;

        if (!content) {
            res.status(400).json({ error: 'Comment content is required' });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                parentId: parentId || null,
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'COMMENTED',
                entityType: 'TASK',
                entityId: taskId,
                taskId,
                userId,
                description: `Commented: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
            }
        });

        res.status(201).json({ comment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Import at top (I will add this separately or assume it's added via multiple replace if tool allows, but I should probably add import first or in same block if possible. Since I can't edit top here easily without affecting other things, I'll do a separate call for import or just add it here if I am careful. I will assume I need to handle imports).

// Actual logic
export const addAssignee = async (req: Request, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const { projectMemberId, organizationMemberId } = req.body;
        const userId = (req as any).userId;

        if (!projectMemberId && !organizationMemberId) {
            res.status(400).json({ error: 'Project member ID or Organization member ID is required' });
            return;
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true }
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        let targetProjectMemberId = projectMemberId;

        // If organizationMemberId is provided, find or create the ProjectMember record
        if (organizationMemberId && !targetProjectMemberId) {
            let projectMember = await prisma.projectMember.findFirst({
                where: {
                    projectId: task.projectId,
                    organizationMemberId
                }
            });

            if (!projectMember) {
                // Find 'Project Member' role or fallback to first role
                const workspace = await prisma.organization.findUnique({
                    where: { id: task.project.organizationId },
                    include: { roles: true }
                });
                const projectMemberRole = workspace?.roles.find(r => r.name === 'Project Member') || workspace?.roles[0];

                if (!projectMemberRole) {
                    res.status(400).json({ error: 'Default project member role not found' });
                    return;
                }

                projectMember = await prisma.projectMember.create({
                    data: {
                        projectId: task.projectId,
                        organizationMemberId,
                        roleId: projectMemberRole.id
                    }
                });
            }
            targetProjectMemberId = projectMember.id;
        }

        const assignee = await prisma.taskAssignee.create({
            data: {
                taskId,
                projectMemberId: targetProjectMemberId,
                assignedById: userId,
            },
            include: {
                projectMember: {
                    include: {
                        organizationMember: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, email: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'ASSIGNED',
                entityType: 'TASK',
                entityId: taskId,
                taskId,
                userId,
                description: `Assigned task to member`
            }
        });

        // Send Email
        try {
            const assigner = await prisma.user.findUnique({ where: { id: userId } });
            const assignedUser = assignee.projectMember.organizationMember.user;
            const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.projectId}?taskId=${taskId}`;

            const html = getTaskAssignedEmailTemplate(
                task.title,
                task.project.name,
                assigner ? `${assigner.firstName} ${assigner.lastName}` : 'A Team Member',
                link
            );

            await sendEmail({
                to: assignedUser.email,
                subject: `New Task Assigned: ${task.title}`,
                html
            });
        } catch (emailErr) {
            console.error('Failed to send task assignment email:', emailErr);
        }

        res.status(201).json({ assignee });
    } catch (error) {
        // Check for unique constraint violation (already assigned)
        if ((error as any).code === 'P2002') {
            res.status(400).json({ error: 'User is already assigned to this task' });
            return;
        }
        console.error('Add assignee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeAssignee = async (req: Request, res: Response) => {
    try {
        const { id: taskId, memberId } = req.params;
        const userId = (req as any).userId;

        await prisma.taskAssignee.delete({
            where: {
                taskId_projectMemberId: {
                    taskId,
                    projectMemberId: memberId,
                }
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'UNASSIGNED',
                entityType: 'TASK',
                entityId: taskId,
                taskId,
                userId,
                description: `Removed assignee from task`
            }
        });

        res.json({ message: 'Assignee removed successfully' });
    } catch (error) {
        console.error('Remove assignee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
