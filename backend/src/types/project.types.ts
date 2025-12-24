import { ProjectStatus, Priority, Project as PrismaProject } from '@prisma/client';

export interface Project extends PrismaProject {}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  color?: string;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  organizationId: string;
  templateId?: string | null;
  settings?: Record<string, any>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: Priority;
  color?: string;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  completedAt?: Date | string | null;
  progress?: number;
  settings?: Record<string, any> | null;
}

export interface ProjectWithRelations extends Project {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  members: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string | null;
    };
    role: string;
    joinedAt: Date;
  }[];
  lists: {
    id: string;
    name: string;
    position: number;
    taskCount: number;
  }[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  blockedTasks: number;
  progress: number;
  overdueTasks: number;
  dueSoonTasks: number;
  members: number;
  completedLists: number;
  totalLists: number;
}

export interface ProjectTimeline {
  id: string;
  name: string;
  startDate: Date | null;
  dueDate: Date | null;
  tasks: {
    id: string;
    title: string;
    status: string;
    startDate: Date | null;
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
}
