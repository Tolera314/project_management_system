import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, TaskStatusEnum } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotificationService } from '../services/notification.service';
import { SocketService } from '../services/socket.service';

const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(200),
    description: z.string().optional(),
    projectId: z.string().cuid(),
    listId: z.string().cuid().optional(),
    parentId: z.string().cuid().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
    startDate: z.string().optional().transform((v: any) => v ? new Date(v) : undefined),
    dueDate: z.string().optional().transform((v: any) => v ? new Date(v) : undefined),
    position: z.number().int().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    listId: z.string().cuid().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
    startDate: z.string().nullable().optional().transform((v: any) => v ? new Date(v) : (v === null ? null : undefined)),
    dueDate: z.string().nullable().optional().transform((v: any) => v ? new Date(v) : (v === null ? null : undefined)),
    position: z.number().int().optional(),
    completedAt: z.string().nullable().optional().transform((v: any) => v ? new Date(v) : (v === null ? null : undefined)),
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

        // Emit Socket Event
        const projectWithOrg = await prisma.project.findUnique({
            where: { id: projectId },
            select: { organizationId: true }
        });
        if (projectWithOrg) {
            SocketService.emitToWorkspace(projectWithOrg.organizationId, 'task-updated', {
                taskId: task.id,
                projectId: task.projectId,
                action: 'CREATE',
                task
            });
        }

        res.status(201).json({ task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const duplicateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const originalTask = await prisma.task.findUnique({
            where: { id },
            include: {
                children: true,
                tags: true,
                assignees: true,
                dependents: true, // Things this task depends on
            }
        });

        if (!originalTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Calculate position (put it right after original)
        const nextPosition = (originalTask.position || 0) + 1;

        const newTask = await prisma.task.create({
            data: {
                title: `${originalTask.title} (Copy)`,
                description: originalTask.description,
                priority: originalTask.priority,
                status: 'TODO', // Reset status for new task
                startDate: originalTask.startDate,
                dueDate: originalTask.dueDate,
                projectId: originalTask.projectId,
                listId: originalTask.listId,
                parentId: originalTask.parentId,
                position: nextPosition,
                createdById: userId,
                updatedById: userId,
                tags: {
                    create: originalTask.tags.map((t: any) => ({
                        tagId: t.tagId
                    }))
                },
                assignees: {
                    create: originalTask.assignees.map((a: any) => ({
                        projectMemberId: a.projectMemberId,
                        assignedById: userId
                    }))
                },
                dependents: {
                    create: originalTask.dependents.map((d: any) => ({
                        sourceId: d.sourceId,
                        type: d.type
                    }))
                },
                children: {
                    create: originalTask.children.map((child: any) => ({
                        title: child.title,
                        description: child.description,
                        priority: child.priority,
                        status: 'TODO',
                        startDate: child.startDate,
                        dueDate: child.dueDate,
                        projectId: child.projectId,
                        listId: child.listId,
                        position: child.position,
                        createdById: userId,
                        updatedById: userId,
                    }))
                }
            },
            include: {
                children: true,
                tags: { include: { tag: true } },
                assignees: { include: { projectMember: { include: { organizationMember: { include: { user: true } } } } } }
            }
        });

        // Emit Socket Event
        const project = await prisma.project.findUnique({
            where: { id: originalTask.projectId },
            select: { organizationId: true }
        });

        if (project) {
            SocketService.emitToWorkspace(project.organizationId, 'task-updated', {
                taskId: newTask.id,
                projectId: newTask.projectId,
                action: 'CREATE',
                task: newTask
            });
        }

        res.status(201).json({ task: newTask });
    } catch (error) {
        console.error('Duplicate task error:', error);
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

        // Date consistency check
        if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
            res.status(400).json({ error: 'Start date cannot be after due date' });
            return;
        }

        // Dependency check: Cannot complete if dependencies are not done
        if (status === 'DONE') {
            const unfinishedDependencies = await prisma.taskDependency.findMany({
                where: {
                    targetId: id,
                    source: {
                        status: { not: 'DONE' }
                    }
                },
                include: { source: true }
            });

            if (unfinishedDependencies.length > 0) {
                const sourceTitles = unfinishedDependencies.map((d: any) => d.source.title).join(', ');
                res.status(400).json({ error: `Cannot complete task: Waiting on unfinished dependencies (${sourceTitles})` });
                return;
            }

            // Subtask check: Cannot complete if children are not done
            const unfinishedSubtasks = await prisma.task.findMany({
                where: {
                    parentId: id,
                    status: { not: 'DONE' }
                }
            });

            if (unfinishedSubtasks.length > 0) {
                res.status(400).json({ error: 'Cannot complete task: Waiting on unfinished subtasks' });
                return;
            }
        }

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
            },
            include: { project: true }
        });

        // Emit Socket Event for real-time update
        SocketService.emitToWorkspace(updatedTask.project.organizationId, 'task-updated', {
            taskId: updatedTask.id,
            projectId: updatedTask.projectId,
            action: 'UPDATE',
            task: updatedTask
        });

        // Send Notification for Status Change
        if (status && status !== task.status) {
            try {
                const updater = await prisma.user.findUnique({ where: { id: userId } });
                const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.projectId}?taskId=${id}`;

                // Notify all assignees AND watchers except the updater
                const assignees = await prisma.taskAssignee.findMany({
                    where: { taskId: id },
                    include: { projectMember: { include: { organizationMember: true } } }
                });

                const watchers = await (prisma as any).taskWatcher.findMany({
                    where: { taskId: id }
                });

                const recipientIds = new Set<string>();
                assignees.forEach(a => recipientIds.add(a.projectMember.organizationMember.userId));
                watchers.forEach((w: any) => recipientIds.add(w.userId));

                for (const recipientId of recipientIds) {
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

                // Log Activity for Status Change
                await prisma.activityLog.create({
                    data: {
                        action: 'STATUS_CHANGED',
                        entityType: 'TASK',
                        entityId: id,
                        taskId: id,
                        userId,
                        description: `Changed status from ${task.status} to ${status}`
                    }
                });
            } catch (notifErr) {
                console.error('Failed to send status update notification:', notifErr);
            }
        }

        // Log Activity for other changes
        if (priority && priority !== task.priority) {
            await prisma.activityLog.create({
                data: {
                    action: 'PRIORITY_CHANGED',
                    entityType: 'TASK',
                    entityId: id,
                    taskId: id,
                    userId,
                    description: `Changed priority from ${task.priority} to ${priority}`
                }
            });
        }

        if (dueDate !== undefined && String(dueDate) !== String(task.dueDate)) {
            await prisma.activityLog.create({
                data: {
                    action: 'DUE_DATE_CHANGED',
                    entityType: 'TASK',
                    entityId: id,
                    taskId: id,
                    userId,
                    description: dueDate ? `Set due date to ${dueDate.toLocaleDateString()}` : 'Cleared due date'
                }
            });
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

        const projectWithOrg = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { organizationId: true }
        });

        await prisma.task.delete({ where: { id } });

        if (projectWithOrg) {
            SocketService.emitToWorkspace(projectWithOrg.organizationId, 'task-updated', {
                taskId: id,
                projectId: task.projectId,
                action: 'DELETE'
            });
        }

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
                    include: { target: true }
                },
                dependents: {
                    include: { source: true }
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
                            select: { id: true, firstName: true, avatarUrl: true } as any
                        }
                    }
                },
                watchers: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, avatarUrl: true } as any
                        }
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                files: {
                    include: {
                        file: true
                    }
                }
            } as any
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

        const validMentionedIds = mentionedUsers.map((u: any) => u.id);

        if (validMentionedIds.length > 0) {
            // Create Mention records
            await prisma.mention.createMany({
                data: validMentionedIds.map((mId: any) => ({
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

        // Send Notification for Comment
        try {
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                include: { project: true }
            });

            if (task) {
                const commenter = await prisma.user.findUnique({ where: { id: userId } });
                const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.projectId}?taskId=${taskId}`;

                // Notify all assignees AND watchers except the commenter AND mentioned users
                const assignees = await prisma.taskAssignee.findMany({
                    where: { taskId },
                    include: { projectMember: { include: { organizationMember: true } } }
                });

                const watchers = await (prisma as any).taskWatcher.findMany({
                    where: { taskId }
                });

                const recipientIds = new Set<string>();
                assignees.forEach(a => recipientIds.add(a.projectMember.organizationMember.userId));
                watchers.forEach((w: any) => recipientIds.add(w.userId));

                for (const recipientId of recipientIds) {
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
                const projectMemberRole = workspace?.roles.find((r: any) => r.name === 'Project Member') || workspace?.roles[0];

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

        // Check if already assigned
        const existingAssignee = await prisma.taskAssignee.findFirst({
            where: {
                taskId,
                projectMemberId: targetProjectMemberId
            }
        });

        if (existingAssignee) {
            res.status(400).json({ error: 'User is already assigned to this task' });
            return;
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

export const watchTask = async (req: Request, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const userId = (req as any).userId;

        const watcher = await (prisma as any).taskWatcher.upsert({
            where: {
                taskId_userId: { taskId, userId }
            },
            create: { taskId, userId },
            update: {} // Do nothing if already watching
        });

        res.status(201).json({ watcher });
    } catch (error) {
        console.error('Watch task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const unwatchTask = async (req: Request, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const userId = (req as any).userId;

        await (prisma as any).taskWatcher.delete({
            where: {
                taskId_userId: { taskId, userId }
            }
        });

        res.json({ message: 'Unwatched task successfully' });
    } catch (error) {
        console.error('Unwatch task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const archiveTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        await prisma.task.update({
            where: { id },
            data: {
                isArchived: true,
                updatedById: userId
            } as any
        });

        res.json({ message: 'Task archived successfully' });
    } catch (error) {
        console.error('Archive task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const restoreTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        await prisma.task.update({
            where: { id },
            data: {
                isArchived: false,
                updatedById: userId
            } as any
        });

        res.json({ message: 'Task restored successfully' });
    } catch (error) {
        console.error('Restore task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { organizationId, projectId, status, priority, assigneeId } = req.query;

        const where: any = {
            project: {
                organizationId: organizationId as string,
                organization: {
                    members: { some: { userId } }
                }
            }
        };

        if (projectId) where.projectId = projectId as string;
        if (status) where.status = status as any; // Assuming TaskStatusEnum is imported or defined
        if (priority) where.priority = priority as any;
        if (assigneeId) {
            where.assignees = {
                some: {
                    projectMember: {
                        organizationMember: { userId: assigneeId as string }
                    }
                }
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: { select: { name: true } },
                assignees: {
                    include: {
                        projectMember: {
                            include: {
                                organizationMember: {
                                    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addTaskDependency = async (req: Request, res: Response) => {
    try {
        const { id: targetId } = req.params;
        const { sourceId, type } = req.body;
        const userId = (req as any).userId;

        // Verify access to both tasks
        const tasks = await prisma.task.findMany({
            where: {
                id: { in: [targetId, sourceId] },
                project: { organization: { members: { some: { userId } } } }
            }
        });

        if (tasks.length < 2) {
            res.status(403).json({ error: 'Access denied or tasks not found' });
            return;
        }

        const dependency = await prisma.taskDependency.create({
            data: {
                sourceId,
                targetId,
                type: type || 'FINISH_TO_START'
            }
        });

        res.status(201).json(dependency);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTaskActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const activity = await prisma.activityLog.findMany({
            where: {
                taskId: id,
                task: {
                    project: { organization: { members: { some: { userId } } } }
                }
            },
            include: {
                user: { select: { firstName: true, lastName: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({ activity });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { content } = req.body;

        const comment = await prisma.comment.findUnique({ where: { id } });
        if (!comment || comment.createdById !== userId) {
            res.status(403).json({ error: 'Comment not found or access denied' });
            return;
        }

        const updated = await prisma.comment.update({
            where: { id },
            data: { content }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const comment = await prisma.comment.findUnique({ where: { id } });
        if (!comment || comment.createdById !== userId) {
            res.status(403).json({ error: 'Comment not found or access denied' });
            return;
        }

        await prisma.comment.delete({ where: { id } });
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addTagToTask = async (req: Request, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const { tagId } = req.body;
        const userId = (req as any).userId;

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const taskTag = await prisma.taskTag.create({
            data: { taskId, tagId },
            include: { tag: true }
        });

        res.status(201).json(taskTag);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeTagFromTask = async (req: Request, res: Response) => {
    try {
        const { id: taskId, tagId } = req.params;
        await prisma.taskTag.delete({
            where: { taskId_tagId: { taskId, tagId } }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const searchTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const {
            q,
            status,
            priority,
            assigneeId,
            tagIds,
            projectId,
            isArchived,
            workspaceId,
            page = '1',
            limit = '20'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            // Only tasks in projects where user is a member or workspace-wide if requested (and permitted)
            project: {
                members: {
                    some: {
                        organizationMember: {
                            userId
                        }
                    }
                }
            }
        };

        if (q) {
            where.OR = [
                { title: { contains: q as string, mode: 'insensitive' } },
                { description: { contains: q as string, mode: 'insensitive' } }
            ];
        }

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (projectId) where.projectId = projectId;
        if (workspaceId) {
            where.project.organizationId = workspaceId;
        }

        if (isArchived !== undefined) {
            where.isArchived = isArchived === 'true';
        } else {
            where.isArchived = false; // Default to non-archived
        }

        if (assigneeId) {
            where.assignees = {
                some: {
                    projectMember: {
                        organizationMember: {
                            userId: assigneeId
                        }
                    }
                }
            };
        }

        if (tagIds) {
            const tagIdList = (tagIds as string).split(',');
            where.tags = {
                some: {
                    tagId: { in: tagIdList }
                }
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: {
                    select: { id: true, name: true, color: true }
                },
                assignees: {
                    include: {
                        projectMember: {
                            include: {
                                organizationMember: {
                                    include: { user: { select: { id: true, firstName: true, avatarUrl: true } as any } }
                                }
                            }
                        }
                    }
                },
                tags: {
                    include: { tag: true }
                }
            } as any,
            orderBy: { updatedAt: 'desc' },
            take: limitNum,
            skip: skip
        });

        const total = await prisma.task.count({ where });

        res.json({
            tasks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Search tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const bulkUpdateTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { taskIds, updates } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            res.status(400).json({ error: 'Invalid task IDs' });
            return;
        }

        const validUpdates: any = {};
        if (updates.status) validUpdates.status = updates.status;
        if (updates.priority) validUpdates.priority = updates.priority;
        if (updates.dueDate !== undefined) validUpdates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
        if (updates.listId) validUpdates.listId = updates.listId;
        if (updates.isArchived !== undefined) validUpdates.isArchived = updates.isArchived;

        const result = await prisma.task.updateMany({
            where: {
                id: { in: taskIds },
                project: {
                    members: {
                        some: {
                            organizationMember: { userId }
                        }
                    }
                }
            },
            data: {
                ...validUpdates,
                updatedById: userId
            }
        });

        // Log activity for each task
        for (const taskId of taskIds) {
            await prisma.activityLog.create({
                data: {
                    action: 'BULK_UPDATED',
                    entityType: 'TASK',
                    entityId: taskId,
                    taskId,
                    userId,
                    description: `Bulk updated fields: ${Object.keys(validUpdates).join(', ')}`
                }
            });
        }

        res.json({ message: `Successfully updated ${result.count} tasks`, count: result.count });
    } catch (error) {
        console.error('Bulk update tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
