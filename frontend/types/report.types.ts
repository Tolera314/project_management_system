export interface ReportData {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  tasksByStatus: {
    status: string;
    count: number;
    color: string;
  }[];
  tasksByPriority: {
    priority: string;
    count: number;
    color: string;
  }[];
  tasksByProject: {
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    color: string;
  }[];
  tasksOverTime: {
    date: string;
    completed: number;
    created: number;
  }[];
}

export interface TimeRangeOption {
  value: string;
  label: string;
}

export const timeRanges: TimeRangeOption[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];
