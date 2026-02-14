import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const convertProjectToTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, description, category, visibility } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Fetch the source project
        const sourceProject = await prisma.project.findUnique({
            where: { id },
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
                members: {
                    include: {
                        organizationMember: {
                            include: {
                                user: true
                            }
                        },
                        role: true
                    }
                }
            }
        });

        if (!sourceProject) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Check if user has permission (must be PM or Admin)
        const userMembership = sourceProject.members.find(
            (m: any) => m.organizationMember.userId === userId
        );

        if (!userMembership || !['Project Manager', 'Admin'].includes(userMembership.role.name)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        // Validate project has structure
        if (sourceProject.lists.length === 0) {
            res.status(400).json({ error: 'Project must have at least one list' });
            return;
        }

        const totalTasks = sourceProject.lists.reduce((sum: any, list: any) => sum + list.tasks.length, 0);
        if (totalTasks === 0) {
            res.status(400).json({ error: 'Project must have at least one task' });
            return;
        }

        // Create template in a transaction
        const template = await prisma.$transaction(async (tx: any) => {
            // Create the template project
            const newTemplate = await tx.project.create({
                data: {
                    name: name || `${sourceProject.name} Template`,
                    description: description || sourceProject.description,
                    organizationId: sourceProject.organizationId,
                    createdById: userId,
                    updatedById: userId,
                    status: 'NOT_STARTED',
                    priority: 'MEDIUM',
                    isTemplate: true,
                    category,
                    isPublic: visibility === 'WORKSPACE',
                    color: sourceProject.color
                }
            });

            // Clone lists and tasks
            for (const list of sourceProject.lists) {
                const newList = await tx.list.create({
                    data: {
                        name: list.name,
                        projectId: newTemplate.id,
                        position: list.position
                    }
                });

                // Clone top-level tasks
                const topLevelTasks = list.tasks.filter(t => !t.parentId);
                for (const task of topLevelTasks) {
                    const newTask = await tx.task.create({
                        data: {
                            title: task.title,
                            description: task.description,
                            priority: task.priority,
                            status: 'TODO',
                            position: task.position,
                            listId: newList.id,
                            projectId: newTemplate.id,
                            createdById: userId,
                            updatedById: userId
                        }
                    });

                    // Clone subtasks
                    const subtasks = list.tasks.filter(t => t.parentId === task.id);
                    if (subtasks.length > 0) {
                        await tx.task.createMany({
                            data: subtasks.map((st: any) => ({
                                title: st.title,
                                description: st.description,
                                priority: st.priority,
                                status: 'TODO',
                                position: st.position,
                                parentId: newTask.id,
                                listId: newList.id,
                                projectId: newTemplate.id,
                                createdById: userId,
                                updatedById: userId
                            }))
                        });
                    }
                }
            }

            // Clone milestones
            if (sourceProject.milestones.length > 0) {
                await tx.milestone.createMany({
                    data: sourceProject.milestones.map((m: any) => ({
                        name: m.name,
                        description: m.description,
                        status: 'PENDING',
                        dueDate: m.dueDate,
                        projectId: newTemplate.id,
                        createdById: userId
                    }))
                });
            }

            return newTemplate;
        });

        res.status(201).json({
            message: 'Template created successfully',
            template
        });

    } catch (error) {
        console.error('Convert to template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// GET /templates
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { category, search, visibility, organizationId } = req.query;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let targetOrganizationId = organizationId as string;

        if (!targetOrganizationId) {
            // Find organization user belongs to as fallback
            const userOrg = await prisma.organizationMember.findFirst({
                where: { userId }
            });

            if (!userOrg) {
                res.status(404).json({ error: 'User not found in any organization' });
                return;
            }
            targetOrganizationId = userOrg.organizationId;
        }

        // Query templates
        const templates = await prisma.project.findMany({
            where: {
                isTemplate: true,
                OR: [
                    { organizationId: targetOrganizationId },
                    { templateVisibility: 'SYSTEM' }
                ],
                AND: [
                    category ? { category: category as string } : {},
                    search ? {
                        OR: [
                            { name: { contains: search as string, mode: 'insensitive' } },
                            { description: { contains: search as string, mode: 'insensitive' } }
                        ]
                    } : {},
                    visibility ? { isPublic: visibility === 'WORKSPACE' } : {}
                ]
            },
            orderBy: { name: 'asc' }
        });

        res.status(200).json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /templates/:id
export const getTemplateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const template = await prisma.project.findUnique({
            where: { id, isTemplate: true },
            include: {
                lists: {
                    include: {
                        tasks: {
                            include: {
                                children: true,
                                assignees: {
                                    include: {
                                        projectMember: {
                                            include: {
                                                organizationMember: {
                                                    include: {
                                                        user: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                milestones: true
            }
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.status(200).json({ template });
    } catch (error) {
        console.error('Get template by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /templates/:id
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;
        const { name, description, category, isPublic } = req.body;

        const template = await prisma.project.update({
            where: { id, isTemplate: true },
            data: {
                name,
                description,
                category,
                isPublic,
                updatedById: userId
            }
        });

        res.status(200).json({ template });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /templates/:id
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Use a transaction to ensure all related structure is deleted
        await prisma.$transaction(async (tx: any) => {
            // Tasks (milestones might be linked)
            await tx.task.deleteMany({ where: { projectId: id } });
            // Lists
            await tx.list.deleteMany({ where: { projectId: id } });
            // Milestones
            await tx.milestone.deleteMany({ where: { projectId: id } });
            // Project members
            await tx.projectMember.deleteMany({ where: { projectId: id } });
            // Final project deletion
            await tx.project.delete({ where: { id } });
        });

        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /templates/use/:id
export const useTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, organizationId, ownerId } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Fetch the template
        const template = await prisma.project.findUnique({
            where: { id, isTemplate: true },
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
                milestones: true
            }
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        // Create new project in a transaction
        const newProject = await prisma.$transaction(async (tx: any) => {
            // 1. Create Project
            const project = await tx.project.create({
                data: {
                    name: name || `New ${template.name}`,
                    description: template.description,
                    organizationId: organizationId || template.organizationId,
                    createdById: userId,
                    updatedById: userId,
                    status: 'NOT_STARTED',
                    priority: 'MEDIUM',
                    isTemplate: false,
                    color: template.color,
                    sourceTemplateId: template.id
                }
            });

            // 2. Add creator as Project Manager
            // We need to find the organization member ID
            const orgMember = await tx.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: project.organizationId,
                        userId: ownerId || userId
                    }
                }
            });

            if (orgMember) {
                // Find PM role
                const pmRole = await tx.role.findFirst({
                    where: {
                        organizationId: project.organizationId,
                        name: 'Project Manager'
                    }
                });

                if (pmRole) {
                    await tx.projectMember.create({
                        data: {
                            projectId: project.id,
                            organizationMemberId: orgMember.id,
                            roleId: pmRole.id
                        }
                    });
                }
            }

            // 3. Clone Lists & Tasks
            for (const list of template.lists) {
                const newList = await tx.list.create({
                    data: {
                        name: list.name,
                        projectId: project.id,
                        position: list.position
                    }
                });

                // Clone top-level tasks
                const topLevelTasks = list.tasks.filter(t => !t.parentId);
                for (const task of topLevelTasks) {
                    const newTask = await tx.task.create({
                        data: {
                            title: task.title,
                            description: task.description,
                            priority: task.priority,
                            status: 'TODO',
                            position: task.position,
                            listId: newList.id,
                            projectId: project.id,
                            createdById: userId,
                            updatedById: userId
                        }
                    });

                    // Clone subtasks
                    const subtasks = list.tasks.filter(t => t.parentId === task.id);
                    if (subtasks.length > 0) {
                        for (const st of subtasks) {
                            await tx.task.create({
                                data: {
                                    title: st.title,
                                    description: st.description,
                                    priority: st.priority,
                                    status: 'TODO',
                                    position: st.position,
                                    parentId: newTask.id,
                                    listId: newList.id,
                                    projectId: project.id,
                                    createdById: userId,
                                    updatedById: userId
                                }
                            });
                        }
                    }
                }
            }

            // 4. Clone Milestones
            if (template.milestones.length > 0) {
                await tx.milestone.createMany({
                    data: template.milestones.map((m: any) => ({
                        name: m.name,
                        description: m.description,
                        status: 'PENDING',
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days out
                        projectId: project.id,
                        createdById: userId
                    }))
                });
            }

            return project;
        });

        res.status(201).json({
            message: 'Project created from template successfully',
            project: newProject
        });

    } catch (error) {
        console.error('Use template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
