export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  color?: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  _count: {
    tasks: number;
    members: number;
  };
  members?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
  }>;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  startDate?: string;
  dueDate?: string;
  status?: Project['status'];
  templateId?: string;
}
