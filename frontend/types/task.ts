export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface TaskAssignee {
  id: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  position: number;
  projectId: string;
  listId?: string;
  parentId?: string;
  milestoneId?: string;
  isArchived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  assignees: TaskAssignee[];
  // Add other relations as needed
}
