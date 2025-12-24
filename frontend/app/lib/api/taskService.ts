'use client';

import { Task, TaskStatusEnum, Priority } from '@/app/types/task';

export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatusEnum;
  priority?: Priority;
  listId: string;
  projectId: string;
  assigneeIds?: string[];
  labels?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getTasks(params?: {
  projectId?: string;
  status?: string;
  assigneeId?: string;
  priority?: string;
  search?: string;
}): Promise<Task[]> {
  const queryParams = new URLSearchParams();
  if (params?.projectId) queryParams.append('projectId', params.projectId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.assigneeId) queryParams.append('assigneeId', params.assigneeId);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.search) queryParams.append('search', params.search);

  const response = await fetch(`/api/tasks?${queryParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch tasks');
  }

  return response.json();
}

export async function getTaskById(id: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch task');
  }

  return response.json();
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create task');
  }

  return response.json();
}

export async function updateTask(id: string, data: Partial<CreateTaskData>): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update task');
  }

  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete task');
  }
}

export async function updateTaskPosition(taskId: string, listId: string, position: number): Promise<void> {
  const response = await fetch('/api/tasks/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId, listId, position }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to reorder tasks');
  }
}
