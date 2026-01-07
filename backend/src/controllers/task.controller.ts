import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, TaskStatusEnum } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotificationService } from '../services/notification.service';

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

        // Send Notification for Status Change
        if (status && status !== task.status) {
            try {
                const updater = await prisma.user.findUnique({ where: { id: userId } });
                const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.projectId}?taskId=${id}`;

                // Notify all assignees except the updater
                const assignees = await prisma.taskAssignee.findMany({
                    where: { taskId: id },
                    include: { projectMember: { include: { organizationMember: true } } }
                });

                for (const assignee of assignees) {
                    const recipientId = assignee.projectMember.organizationMember.userId;
                    if (recipientId === userId) continue;

                    await NotificationService.notify({
                        type: 'TASK_STATUS_CHANGED',
                        recipientId,
                        actorId: userId,
                        projectId: task.projectId,
                        taskId: id,
                        title: 'Task Status Updated',
                        message: `${updater ? `${updater.firstName} ${updater.lastName}` : 'A team member'} changed the status of "${task.title}" to ${status}`,
                        link,
                        metadata: {
                            taskTitle: task.title,
                            oldStatus: task.status,
                            newStatus: status,
                            actorName: updater ? `${updater.firstName} ${updater.lastName}` : 'A team member'
                        }
                    });
                }
            } catch (notifErr) {
                console.error('Failed to send status update notification:', notifErr);
            }
        }

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

        // Parse Mentions @[Name](userId)
        // Regex to capture userId from the markdown-like syntax
        const mentionRegex = /@\[[^\]]+\]\(([a-zA-Z0-9-]+)\)/g;
        const mentionedUserIds = new Set<string>();
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentionedUserIds.add(match[1]);
        }

        // Validate and Create Mentions
        const mentionedUsers = await prisma.user.findMany({
            where: { id: { in: Array.from(mentionedUserIds) } }
        });

        const validMentionedIds = mentionedUsers.map(u => u.id);

        if (validMentionedIds.length > 0) {
            // Create Mention records
            await prisma.mention.createMany({
                data: validMentionedIds.map(mId => ({
                    commentId: comment.id,
                    userId: mId,
                    mentionedById: userId
                }))
            });

            // Send Notifications to Mentioned Users
            const commenter = await prisma.user.findUnique({ where: { id: userId } });
            const taskDetails = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });

            if (taskDetails) {
                const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${taskDetails.projectId}?taskId=${taskId}`;

                for (const mId of validMentionedIds) {
                    if (mId === userId) continue; // Don't notify self

                    await NotificationService.notify({
                        type: 'MENTIONED',
                        recipientId: mId,
                        actorId: userId,
                        projectId: taskDetails.projectId,
                        taskId,
                        title: 'You were mentioned',
                        message: `${commenter ? `${commenter.firstName} ${commenter.lastName}` : 'A team member'} mentioned you in "${taskDetails.title}"`,
                        link,
                        metadata: {
                            taskTitle: taskDetails.title,
                            commentContent: content,
                            actorName: commenter ? `${commenter.firstName} ${commenter.lastName}` : 'A team member'
                        }
                    });
                }
            }
        }

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

        // Send Notification for Comment (Skip mentioned users to avoid double notify if desired, or send both. Usually separate is better)
        // We will skip mentioned users here.
        try {
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                include: { project: true }
            });

            if (task) {
                const commenter = await prisma.user.findUnique({ where: { id: userId } });
                const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.projectId}?taskId=${taskId}`;

                // Notify all assignees except the commenter AND mentioned users
                const assignees = await prisma.taskAssignee.findMany({
                    where: { taskId },
                    include: { projectMember: { include: { organizationMember: true } } }
                });

                for (const assignee of assignees) {
                    const recipientId = assignee.projectMember.organizationMember.userId;

                    // Skip if self
                    if (recipientId === userId) continue;

                    // Skip if already notified via mention
                    if (validMentionedIds.includes(recipientId)) continue;

                    await NotificationService.notify({
                        type: 'TASK_COMMENTED',
                        recipientId,
                        actorId: userId,
                        projectId: task.projectId,
                        taskId,
                        title: 'New Comment on Task',
                        message: `${commenter ? `${commenter.firstName} ${commenter.lastName}` : 'A team member'} commented on "${task.title}"`,
                        link,
                        metadata: {
                            taskTitle: task.title,
                            commentContent: content,
                            actorName: commenter ? `${commenter.firstName} ${commenter.lastName}` : 'A team member'
                        }
                    });
                }
            }
        } catch (notifErr) {
            console.error('Failed to send comment notification:', notifErr);
        }

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

        // Send Notification (In-App + Email via Service)
        try {
            const assigner = await prisma.user.findUnique({ where: { id: userId } });
            const assignedUser = assignee.projectMember.organizationMember.user;
            const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.projectId}?taskId=${taskId}`;

            await NotificationService.notify({
                type: 'TASK_ASSIGNED',
                recipientId: assignedUser.id,
                actorId: userId,
                projectId: task.projectId,
                taskId: taskId,
                title: 'New Task Assigned',
                message: `${assigner ? `${assigner.firstName} ${assigner.lastName}` : 'A team member'} assigned you a task: ${task.title}`,
                link: link,
                metadata: {
                    taskTitle: task.title,
                    projectName: task.project.name,
                    actorName: assigner ? `${assigner.firstName} ${assigner.lastName}` : 'A team member'
                }
            });
        } catch (notifErr) {
            console.error('Failed to send task assignment notification:', notifErr);
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
