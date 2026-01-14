import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotificationService } from '../services/notification.service';

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
    templateId: z.string().cuid().optional(),
    isTemplate: z.boolean().default(false),
    category: z.string().optional(),
    isPublic: z.boolean().default(false),
});

// Imports at top
import { sendEmail, getProjectInvitationTemplate } from '../lib/email';

// ... (existing helper schemas)

const addMemberSchema = z.object({
    email: z.string().email(),
    roleId: z.string().cuid(),
});

// Update createProject to assign creator as PM
export const createProject = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = createProjectSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, description, organizationId, startDate, dueDate, priority, status, color, dependencyIds, templateId, isTemplate, category, isPublic } = validation.data;

        // Verify user is member of organization
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                }
            },
        });

        if (!membership) {
            res.status(403).json({ error: 'You are not a member of this organization' });
            return;
        }

        // Find or create 'Project Manager' role for this organization
        let pmRole = await prisma.role.findFirst({
            where: { organizationId, name: 'Project Manager' }
        });


        const project = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create PM role if it doesn't exist (Lazy seeding)
            if (!pmRole) {
                pmRole = await tx.role.create({
                    data: {
                        name: 'Project Manager',
                        description: 'Full access to project',
                        organizationId,
                        createdById: userId,
                        isSystem: true
                    }
                });
            }

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
                    isTemplate: isTemplate || false,
                    category,
                    isPublic: isPublic || false,
                    sourceTemplateId: templateId
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

            // Add Creator as Project Manager
            await tx.projectMember.create({
                data: {
                    projectId: newProject.id,
                    organizationMemberId: membership.id,
                    roleId: pmRole!.id
                }
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

            // Handle Template Cloning
            if (templateId) {
                const template = await tx.project.findUnique({
                    where: { id: templateId },
                    include: {
                        lists: {
                            include: {
                                tasks: {
                                    include: {
                                        children: true
                                    }
                                }
                            }
                        },
                        milestones: true,
                        // dependencies: true // Internal dependencies only? Complex to clone.
                    }
                });

                if (template) {
                    // Clone Milestones
                    // Calculate date shift
                    const dateShift = startDate && template.startDate
                        ? startDate.getTime() - template.startDate.getTime()
                        : 0;

                    const shiftDate = (d: Date | null) => d ? new Date(d.getTime() + dateShift) : null;

                    // Clone Milestones
                    if (template.milestones.length > 0) {
                        await tx.milestone.createMany({
                            data: template.milestones.map(m => ({
                                name: m.name,
                                description: m.description,
                                status: 'PENDING',
                                dueDate: shiftDate(m.dueDate) || new Date(), // Enforce valid date
                                projectId: newProject.id,
                                createdById: userId
                            }))
                        });
                    }

                    // Clone Lists & Tasks
                    for (const list of template.lists) {
                        const newList = await tx.list.create({
                            data: {
                                name: list.name, // Fix title -> name
                                projectId: newProject.id,
                                position: list.position,
                                // type: list.type // List doesn't seem to have type in schema view, removing to be safe or check schema
                            }
                        });

                        // Filter top-level tasks
                        const topLevelTasks = list.tasks.filter(t => !t.parentId);

                        for (const task of topLevelTasks) {
                            const newTask = await tx.task.create({
                                data: {
                                    title: task.title,
                                    description: task.description,
                                    priority: task.priority,
                                    status: 'TODO', // Reset status
                                    startDate: shiftDate(task.startDate),
                                    dueDate: shiftDate(task.dueDate),
                                    position: task.position,
                                    listId: newList.id,
                                    projectId: newProject.id,
                                    createdById: userId,
                                    updatedById: userId
                                }
                            });

                            // Subtasks
                            const subtasks = list.tasks.filter(t => t.parentId === task.id);
                            if (subtasks.length > 0) {
                                await tx.task.createMany({
                                    data: subtasks.map(st => ({
                                        title: st.title,
                                        description: st.description,
                                        priority: st.priority,
                                        status: 'TODO',
                                        startDate: shiftDate(st.startDate),
                                        dueDate: shiftDate(st.dueDate),
                                        position: st.position,
                                        parentId: newTask.id,
                                        listId: newList.id,
                                        projectId: newProject.id,
                                        createdById: userId,
                                        updatedById: userId
                                    }))
                                });
                            }
                        }
                    }
                }
            } else if (isTemplate) {
                // Create default lists for a fresh template if needed, or leave empty
                // For now, empty
            } else {
                // Default Lists for normal project (TODO, IN PROGRESS, DONE)
                /* Commented out as requested - user wants to define their own lists
                await tx.list.createMany({
                    data: [
                        { name: 'To Do', projectId: newProject.id, position: 0 },
                        { name: 'In Progress', projectId: newProject.id, position: 1 },
                        { name: 'Done', projectId: newProject.id, position: 2 },
                    ]
                });
                */
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
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                }
            },
        });

        if (!membership) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const projects = await prisma.project.findMany({
            where: {
                organizationId,
                isTemplate: false, // Filter out templates
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

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { organizationId } = req.query;

        if (!organizationId || typeof organizationId !== 'string') {
            res.status(400).json({ error: 'Organization ID is required' });
            return;
        }

        const templates = await prisma.project.findMany({
            where: {
                organizationId,
                isTemplate: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProjectDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const project = await prisma.project.findFirst({
            where: {
                id,
                organization: {
                    members: { some: { userId } }
                }
            },
            include: {
                lists: {
                    orderBy: { position: 'asc' },
                    include: {
                        dependencies: {
                            include: { source: true }
                        },
                        tasks: {
                            where: { parentId: null }, // Only top-level tasks
                            orderBy: { position: 'asc' },
                            include: {
                                assignees: {
                                    include: {
                                        projectMember: {
                                            include: {
                                                organizationMember: {
                                                    include: {
                                                        user: {
                                                            select: { id: true, firstName: true, lastName: true, email: true } // Added email
                                                        }
                                                    }
                                                },
                                                role: true // Include Role
                                            }
                                        }
                                    }
                                },
                                children: {
                                    orderBy: { position: 'asc' },
                                    include: { // Include assignees for subtasks too
                                        assignees: {
                                            include: {
                                                projectMember: {
                                                    include: {
                                                        organizationMember: {
                                                            include: {
                                                                user: {
                                                                    select: { id: true, firstName: true, lastName: true, email: true }
                                                                }
                                                            }
                                                        },
                                                        role: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                _count: {
                                    select: { children: true }
                                }
                            }
                        }
                    }
                },
                members: {
                    include: {
                        organizationMember: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, email: true }
                                }
                            }
                        },
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                },
                organization: {
                    include: {
                        roles: true,
                        members: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, email: true }
                                },
                                role: true
                            }
                        }
                    }
                },
                invitations: {
                    where: { status: 'PENDING' }
                },
                _count: {
                    select: { tasks: true }
                }
            } as any
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Find current member ID
        const currentMember = (project as any).members?.find((m: any) => m.organizationMember?.user?.id === userId);

        res.json({
            project,
            currentMemberId: currentMember?.id,
            currentMemberRole: currentMember?.role
        });
    } catch (error) {
        console.error('Get project details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add Member
export const addMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Project ID
        const userId = (req as any).userId;
        const validation = addMemberSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { email, roleId } = validation.data;

        // 1. Get Project & Organization
        const project = await prisma.project.findUnique({
            where: { id },
            include: { organization: true }
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // 2. Find User by Email or provision new one
        let userToAdd = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToAdd) {
            console.log(`[ProjectService] User ${email} not found. Provisioning new user.`);
            // Provision new user
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const nameParts = email.split('@')[0].split('.');
            const firstName = nameParts[0] || 'Invited';
            const lastName = nameParts.length > 1 ? nameParts[1] : 'User';

            userToAdd = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
                    lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
                }
            });
            console.log(`[ProjectService] Provisioned user ${email} with temp password: ${tempPassword}`);
        }

        // 3. Check/Add to Organization
        let orgMember = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: project.organizationId,
                    userId: userToAdd.id
                }
            }
        });

        // 4. Handle Membership and Invitation
        if (orgMember) {
            // User is already in org, check if already in project
            const existingPM = await prisma.projectMember.findUnique({
                where: {
                    projectId_organizationMemberId: {
                        projectId: id,
                        organizationMemberId: orgMember.id
                    }
                }
            });

            if (existingPM) {
                res.status(200).json({
                    message: 'User is already a member of this project',
                    id: existingPM.id
                });
                return;
            }

            // Directly add to project
            const newPM = await prisma.projectMember.create({
                data: {
                    projectId: id,
                    organizationMemberId: orgMember.id,
                    roleId: roleId
                }
            });

            // Send Notification
            try {
                const inviter = await prisma.user.findUnique({ where: { id: userId } });
                const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${id}`;

                await NotificationService.notify({
                    type: 'PROJECT_MEMBER_ADDED',
                    recipientId: userToAdd.id,
                    actorId: userId,
                    projectId: id,
                    title: 'Added to Project',
                    message: `${inviter ? `${inviter.firstName} ${inviter.lastName}` : 'A team member'} added you to the project: ${project.name}`,
                    link: link,
                    metadata: {
                        projectName: project.name,
                        actorName: inviter ? `${inviter.firstName} ${inviter.lastName}` : 'A team member'
                    }
                });
            } catch (notifErr) {
                console.error('Failed to send project member notification:', notifErr);
            }

            res.status(201).json({
                message: 'Member added to project successfully',
                id: newPM.id,
                member: newPM
            });
            return;
        }

        // If NOT in org, create Invitation
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await (prisma as any).invitation.upsert({
            where: { token },
            create: {
                token,
                email: email.toLowerCase(),
                type: 'PROJECT',
                projectId: id,
                roleId: roleId,
                invitedById: userId,
                expiresAt
            },
            update: {
                token,
                roleId: roleId,
                expiresAt
            }
        });

        // 5. Send Email
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`;

        try {
            const role = await prisma.role.findUnique({ where: { id: roleId } });
            const html = getProjectInvitationTemplate(
                project.name,
                currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'A Project Manager',
                role ? role.name : 'Member',
                inviteLink
            );

            await sendEmail({
                to: email,
                subject: `Invitation to join project: ${project.name}`,
                html
            });
        } catch (emailErr) {
            console.error('Failed to send invite email:', emailErr);
        }

        res.status(201).json({
            message: 'Project invitation sent successfully',
            token: token
        });

    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove Member
export const removeMember = async (req: Request, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = (req as any).userId;

        // Find the member to be removed
        const memberToRemove = await prisma.projectMember.findFirst({
            where: { id: memberId, projectId: id },
            include: {
                role: true,
                organizationMember: {
                    include: { user: true }
                }
            }
        });

        if (!memberToRemove) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }

        // Safety Rule: Prevent removing the last Project Manager
        if (memberToRemove.role.name === 'Project Manager') {
            const pmCount = await prisma.projectMember.count({
                where: {
                    projectId: id,
                    role: { name: 'Project Manager' }
                }
            });

            if (pmCount <= 1) {
                res.status(400).json({ error: 'Cannot remove the last Project Manager from the project' });
                return;
            }
        }

        await prisma.projectMember.delete({
            where: { id: memberId }
        });

        res.status(200).json({ message: 'Member removed successfully' });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Update Member Role
export const updateMemberRole = async (req: Request, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const { roleId } = req.body;
        const userId = (req as any).userId;

        if (!roleId) {
            res.status(400).json({ error: 'Role ID is required' });
            return;
        }

        const member = await prisma.projectMember.findFirst({
            where: { id: memberId, projectId: id },
            include: { role: true, organizationMember: { include: { user: true } } }
        });

        if (!member) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }

        const newRole = await prisma.role.findUnique({ where: { id: roleId } });
        if (!newRole) {
            res.status(404).json({ error: 'New role not found' });
            return;
        }

        // Validate role belongs to the same organization
        const project = await prisma.project.findUnique({
            where: { id },
            select: { organizationId: true }
        });

        if (project && newRole.organizationId !== project.organizationId) {
            res.status(400).json({ error: 'Role does not belong to this organization' });
            return;
        }

        // Safety Rule: Cannot downgrade/change own role via this endpoint
        // (Prevents accidental self-lockout or privilege escalation)
        const memberUserId = member.organizationMember.userId;
        if (memberUserId === userId) {
            res.status(403).json({ error: 'You cannot change your own role' });
            return;
        }

        const updatedMember = await prisma.projectMember.update({
            where: { id: memberId },
            data: { roleId },
            include: { role: true }
        });

        // Notify member about role change
        try {
            await NotificationService.notify({
                type: 'PROJECT_ROLE_CHANGED',
                recipientId: member.organizationMember.userId,
                actorId: userId,
                projectId: id,
                title: 'Role Updated',
                message: `Your role in project "${member.projectId}" has been changed to ${newRole.name}.`,
                link: `/projects/${id}`,
                metadata: {
                    newRole: newRole.name,
                    oldRole: member.role.name
                }
            });
        } catch (notifErr) {
            console.error('Failed to send role update notification:', notifErr);
        }

        res.json({ member: updatedMember });
    } catch (error) {
        console.error('Update member role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
