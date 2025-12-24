export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface TaskAssignee {
  id: string;
  user: User;
  assignedAt: Date;
  assignedBy: User;
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: User;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export enum TaskStatusEnum {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: TaskStatusEnum;
  priority: Priority;
  position: number;
  listId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  assignees: TaskAssignee[];
  labels: TaskLabel[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface List {
  id: string;
  name: string;
  position: number;
  projectId: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  lists: List[];
}
