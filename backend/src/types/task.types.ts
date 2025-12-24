import { TaskStatusEnum, Priority, Task as PrismaTask } from '@prisma/client';

export interface Task extends PrismaTask {}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatusEnum;
  priority?: Priority;
  dueDate?: Date | string | null;
  listId: string;
  projectId: string;
  parentId?: string | null;
  assigneeIds?: string[];
  labels?: string[];
  estimatedTime?: number | null;
  timeSpent?: number | null;
  position?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  settings?: Record<string, any>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatusEnum;
  priority?: Priority;
  dueDate?: Date | string | null;
  listId?: string;
  parentId?: string | null;
  position?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  completedAt?: Date | string | null;
  estimatedTime?: number | null;
  timeSpent?: number | null;
  settings?: Record<string, any> | null;
}

export interface TaskWithRelations extends Task {
  project: {
    id: string;
    name: string;
    color: string | null;
  };
  list: {
    id: string;
    name: string;
  };
  assignees: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  }[];
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  parent?: {
    id: string;
    title: string;
    status: TaskStatusEnum;
  } | null;
  children: {
    id: string;
    title: string;
    status: TaskStatusEnum;
    priority: Priority;
    dueDate: Date | null;
    assignees: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
      };
    }[];
  }[];
  _count?: {
    children: number;
    comments: number;
    attachments: number;
  };
}

export interface TaskFilterOptions {
  status?: TaskStatusEnum[];
  priority?: Priority[];
  assigneeId?: string;
  projectId?: string;
  listId?: string;
  labelId?: string;
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
  includeCompleted?: boolean;
  includeArchived?: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  blocked: number;
  overdue: number;
  dueSoon: number;
  byStatus: Array<{
    status: TaskStatusEnum;
    count: number;
  }>;
  byPriority: Array<{
    priority: Priority;
    count: number;
  }>;
  byAssignee: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    count: number;
  }>;
  byLabel: Array<{
    id: string;
    name: string;
    color: string;
    count: number;
  }>;
}
