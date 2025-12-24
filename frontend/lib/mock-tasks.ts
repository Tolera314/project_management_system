import { Task } from '@/types/task';

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Set up JWT authentication with refresh tokens',
    status: 'in-progress',
    priority: 'HIGH',
    dueDate: '2023-12-31',
    estimatedHours: 8,
    position: 0,
    projectId: 'project-1',
    isArchived: false,
    tags: ['auth', 'backend'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    updatedById: 'user-1',
    assignees: [
      {
        id: 'assignee-1',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatarUrl: '/avatars/01.png'
        }
      }
    ]
  },
  {
    id: '2',
    title: 'Design dashboard layout',
    description: 'Create responsive dashboard layout with sidebar and main content area',
    status: 'todo',
    priority: 'MEDIUM',
    dueDate: '2023-12-25',
    estimatedHours: 4,
    position: 1,
    projectId: 'project-1',
    isArchived: false,
    tags: ['design', 'frontend'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-2',
    updatedById: 'user-2',
    assignees: [
      {
        id: 'assignee-2',
        user: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatarUrl: '/avatars/02.png'
        }
      }
    ]
  },
  {
    id: '3',
    title: 'Set up database schema',
    description: 'Define and implement database tables and relationships',
    status: 'done',
    priority: 'HIGH',
    dueDate: '2023-12-20',
    estimatedHours: 6,
    position: 2,
    projectId: 'project-1',
    isArchived: false,
    tags: ['database', 'backend'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-3',
    updatedById: 'user-3',
    assignees: [
      {
        id: 'assignee-3',
        user: {
          id: 'user-3',
          name: 'Alex Johnson',
          email: 'alex@example.com',
          avatarUrl: '/avatars/03.png'
        }
      }
    ]
  }
];
