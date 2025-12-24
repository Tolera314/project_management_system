import { NextResponse } from 'next/server';
import { Priority, TaskStatusEnum } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper function to make authenticated requests to the backend
async function fetchWithAuth(url: string, options: RequestInit = {}, session: any) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(session?.accessToken && { 'Authorization': `Bearer ${session.accessToken}` }),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch data');
  }

  return response.json();
}

// Define the TaskStatus enum to match the Prisma schema
const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
} as const;

type TaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: keyof typeof TaskStatus;
  priority: keyof typeof Priority;
  position: number;
  listId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  assignees: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
  list: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
    color: string | null;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

// Input validation schemas
const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.nativeEnum(TaskStatusEnum).optional(),
  priority: z.nativeEnum(Priority).optional(),
  listId: z.string().min(1, 'List ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeIds: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
});

const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.string().min(1, 'Task ID is required'),
  listId: z.string().min(1, 'List ID is required').optional(),
  projectId: z.string().min(1, 'Project ID is required').optional(),
});

// GET /api/tasks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    // Build query params for the backend API
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (status) params.append('status', status);
    if (assigneeId) params.append('assigneeId', assigneeId);
    if (priority) params.append('priority', priority);
    if (search) params.append('search', search);

    const tasks = await fetchWithAuth(
      `/tasks?${params.toString()}`,
      { method: 'GET' },
      session
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validation = taskCreateSchema.safeParse(data);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const task = await fetchWithAuth(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify(validation.data),
      },
      session
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validation = taskUpdateSchema.safeParse({ ...data, id: params.id });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const updatedTask = await fetchWithAuth(
      `/tasks/${params.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      session
    );

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await fetchWithAuth(
      `/tasks/${params.id}`,
      { method: 'DELETE' },
      session
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/reorder
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, listId, position } = await request.json();

    if (!taskId || !listId || position === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await fetchWithAuth(
      `/tasks/${taskId}/position`,
      {
        method: 'PATCH',
        body: JSON.stringify({ listId, position }),
      },
      session
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}
