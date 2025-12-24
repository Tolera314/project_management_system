import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, Priority, TaskStatusEnum } from '@prisma/client';
import prisma from '../lib/prisma';

// Schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.nativeEnum(TaskStatusEnum).optional(),
  priority: z.nativeEnum(Priority).optional(),
  listId: z.string().min(1, 'List ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeIds: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
});

// Schema for task update
const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().min(1, 'Task ID is required'),
  listId: z.string().min(1, 'List ID is required').optional(),
  projectId: z.string().min(1, 'Project ID is required').optional(),
});

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { listId, projectId, assigneeIds, ...taskData } = validation.data;

    // Check if the list exists and belongs to the project
    const list = await prisma.list.findUnique({
      where: { id: listId, projectId },
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Get the highest position in the current list
    const lastTask = await prisma.task.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    // Create the task
    const task = await prisma.task.create({
      data: {
        ...taskData,
        position,
        list: { connect: { id: listId } },
        project: { connect: { id: projectId } },
        createdBy: { connect: { id: userId } },
        updatedBy: { connect: { id: userId } },
        assignees: assigneeIds?.length ? {
          create: assigneeIds.map(assigneeId => ({
            user: { connect: { id: assigneeId } },
            assignedBy: userId,
          })),
        } : undefined,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = updateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { id, listId, projectId, assigneeIds, ...updateData } = validation.data;

    // Check if task exists and user has permission
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If listId is being updated, verify the new list exists in the same project
    if (listId && listId !== task.listId) {
      const newList = await prisma.list.findUnique({
        where: { id: listId, projectId: task.projectId },
      });

      if (!newList) {
        return res.status(400).json({ error: 'Invalid list' });
      }
    }

    // Handle assignees update if provided
    let assigneesUpdate = {};
    if (assigneeIds) {
      // First, remove all existing assignees
      await prisma.taskAssignee.deleteMany({
        where: { taskId: id },
      });

      // Then add the new assignees if any
      if (assigneeIds.length > 0) {
        assigneesUpdate = {
          assignees: {
            create: assigneeIds.map(assigneeId => ({
              user: { connect: { id: assigneeId } },
              assignedBy: userId,
            })),
          },
        };
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        ...(listId && listId !== task.listId ? { list: { connect: { id: listId } } } : {}),
        updatedBy: { connect: { id: userId } },
        ...assigneesUpdate,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if task exists and user has permission
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete the task
    await prisma.task.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        list: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Add a dependency between tasks
export const addTaskDependency = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { dependencyId, type = 'FINISH_TO_START' } = req.body;

    // Check if both tasks exist and belong to the same project
    const [task, dependency] = await Promise.all([
      prisma.task.findUnique({ 
        where: { id: taskId },
        include: { project: true }
      }),
      prisma.task.findUnique({ 
        where: { id: dependencyId },
        include: { project: true }
      })
    ]);

    if (!task || !dependency) {
      return res.status(404).json({ error: 'Task or dependency not found' });
    }

    if (task.projectId !== dependency.projectId) {
      return res.status(400).json({ error: 'Tasks must be in the same project' });
    }

    // Check for circular dependencies
    if (taskId === dependencyId) {
      return res.status(400).json({ error: 'A task cannot depend on itself' });
    }

    // Add the dependency
    const dependencyRecord = await prisma.taskDependency.create({
      data: {
        sourceId: taskId,
        targetId: dependencyId,
        type,
      },
      include: {
        source: true,
        target: true,
      },
    });

    res.status(201).json(dependencyRecord);
  } catch (error) {
    console.error('Error adding task dependency:', error);
    res.status(500).json({ error: 'Failed to add task dependency' });
  }
};

// Remove a task dependency
export const removeTaskDependency = async (req: Request, res: Response) => {
  try {
    const { taskId, dependencyId } = req.params;

    await prisma.taskDependency.deleteMany({
      where: {
        sourceId: taskId,
        targetId: dependencyId,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing task dependency:', error);
    res.status(500).json({ error: 'Failed to remove task dependency' });
  }
};

// Get all dependencies for a task
export const getTaskDependencies = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const dependencies = await prisma.taskDependency.findMany({
      where: {
        OR: [
          { sourceId: taskId },
          { targetId: taskId },
        ],
      },
      include: {
        source: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        target: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching task dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch task dependencies' });
  }
};

// Search tasks with filters
export const searchTasks = async (req: Request, res: Response) => {
  try {
    const { 
      query = '', 
      projectId, 
      status, 
      assigneeId, 
      dueDateFrom, 
      dueDateTo,
      priority,
      limit = 20,
      offset = 0
    } = req.query;

    const where: any = {
      title: { contains: query as string, mode: 'insensitive' },
      ...(projectId && { projectId: projectId as string }),
      ...(status && { status: status as string }),
      ...(priority && { priority: priority as string }),
      ...(assigneeId && {
        assignees: {
          some: {
            userId: assigneeId as string,
          },
        },
      }),
      ...(dueDateFrom || dueDateTo
        ? {
            dueDate: {
              ...(dueDateFrom && { gte: new Date(dueDateFrom as string) }),
              ...(dueDateTo && { lte: new Date(dueDateTo as string) }),
            },
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ error: 'Failed to search tasks' });
  }
};

// Get tasks by project
export const getTasksByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, limit = 100, offset = 0 } = req.query;

    const where: any = { projectId };
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          list: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { position: 'asc' },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
};

// Get tasks by assignee
export const getTasksByAssignee = async (req: Request, res: Response) => {
  try {
    const { assigneeId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = {
      assignees: {
        some: {
          userId: assigneeId,
        },
      },
    };

    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          list: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching assignee tasks:', error);
    res.status(500).json({ error: 'Failed to fetch assignee tasks' });
  }
};

// Update task status
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!Object.values(TaskStatusEnum).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status,
        ...(status === 'DONE' ? { completedAt: new Date() } : {}),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

export const updateTaskPosition = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { taskId } = req.params;
    const { position, listId } = req.body;

    if (position === undefined || !listId) {
      return res.status(400).json({ error: 'Position and listId are required' });
    }

    // Start a transaction to update positions
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get the current task
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { id: true, position: true, listId: true },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // If the list is changing, verify the new list exists
      if (listId !== task.listId) {
        const targetList = await tx.list.findUnique({
          where: { id: listId },
        });

        if (!targetList) {
          throw new Error('Target list not found');
        }
      }

      // Update the task's position and list
      await tx.task.update({
        where: { id: taskId },
        data: {
          position,
          list: { connect: { id: listId } },
          updatedBy: { connect: { id: userId } },
        },
      });

      // If the list changed, we need to update positions in both the old and new lists
      if (listId !== task.listId) {
        // Update positions in the old list (decrement positions of tasks after the moved task)
        await tx.task.updateMany({
          where: {
            listId: task.listId,
            position: { gt: task.position },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // Update positions in the new list (increment positions of tasks at or after the new position)
        await tx.task.updateMany({
          where: {
            listId,
            position: { gte: position },
            id: { not: taskId },
          },
          data: {
            position: { increment: 1 },
          },
        });
      } else {
        // If the list didn't change, just update positions within the same list
        if (position > task.position) {
          // Moving down in the list
          await tx.task.updateMany({
            where: {
              listId,
              position: { lte: position, gt: task.position },
              id: { not: taskId },
            },
            data: {
              position: { decrement: 1 },
            },
          });
        } else if (position < task.position) {
          // Moving up in the list
          await tx.task.updateMany({
            where: {
              listId,
              position: { gte: position, lt: task.position },
              id: { not: taskId },
            },
            data: {
              position: { increment: 1 },
            },
          });
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task position:', error);
    res.status(500).json({ error: 'Failed to update task position' });
  }
};
