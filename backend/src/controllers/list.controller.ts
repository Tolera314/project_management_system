import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createListSchema = z.object({
    name: z.string().min(1, 'List name is required').max(100),
    projectId: z.string().cuid(),
    description: z.string().max(1000).optional(),
    color: z.string().max(50).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.string().optional(),
    position: z.number().int().optional(),
});

const updateListSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),
    color: z.string().max(50).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.string().optional(),
    position: z.number().int().optional(),
});

export const createList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const validation = createListSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, projectId, description, color, priority, status, position } = validation.data;

        // ... verify user has access (lines 28-45) ...
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization: {
                    members: {
                        some: {
                            userId
                        }
                    }
                }
            }
        });

        if (!project) {
            res.status(403).json({ error: 'Access denied or project not found' });
            return;
        }

        const listCount = await prisma.list.count({ where: { projectId } });

        const list = await prisma.list.create({
            data: {
                name,
                projectId,
                description,
                color,
                priority,
                status,
                position: position ?? listCount,
            }
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'CREATED',
                entityType: 'LIST',
                entityId: list.id,
                projectId,
                listId: list.id,
                userId,
                description: `Created list: ${name}`
            }
        });

        res.status(201).json({ list });
    } catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProjectLists = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = (req as any).userId;

        const lists = await prisma.list.findMany({
            where: {
                projectId,
                project: {
                    organization: {
                        members: {
                            some: { userId }
                        }
                    }
                }
            },
            orderBy: { position: 'asc' },
            include: {
                dependencies: {
                    include: { source: true }
                },
                tasks: {
                    where: { parentId: null }, // Only top-level tasks in the main list
                    orderBy: { position: 'asc' },
                    include: {
                        children: {
                            orderBy: { position: 'asc' },
                            include: {
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
                                }
                            }
                        },
                        _count: {
                            select: { children: true }
                        },
                        assignees: {
                            include: {
                                projectMember: {
                                    include: {
                                        organizationMember: {
                                            include: {
                                                user: {
                                                    select: {
                                                        id: true,
                                                        firstName: true,
                                                        lastName: true,
                                                        email: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.json({ lists });
    } catch (error) {
        console.error('Get lists error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateList = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;
        const validation = updateListSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        // Verify access via project
        const list = await prisma.list.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            }
        });

        if (!list) {
            res.status(404).json({ error: 'List not found or access denied' });
            return;
        }

        const updatedList = await prisma.list.update({
            where: { id },
            data: validation.data
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'UPDATED',
                entityType: 'LIST',
                entityId: id,
                projectId: list.projectId,
                listId: id,
                userId,
                description: `Updated list: ${list.name}`
            }
        });

        res.json({ list: updatedList });
    } catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getListDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const list = await prisma.list.findFirst({
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
                tasks: {
                    orderBy: { position: 'asc' },
                    include: {
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

        if (!list) {
            res.status(404).json({ error: 'List not found' });
            return;
        }

        res.json({ list });
    } catch (error) {
        console.error('Get list details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteList = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const list = await prisma.list.findFirst({
            where: {
                id,
                project: {
                    organization: {
                        members: { some: { userId } }
                    }
                }
            }
        });

        if (!list) {
            res.status(404).json({ error: 'List not found or access denied' });
            return;
        }

        await prisma.list.delete({ where: { id } });
        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
