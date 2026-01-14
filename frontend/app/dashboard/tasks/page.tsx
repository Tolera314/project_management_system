'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, AlertCircle, Search, Filter, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { Task, TaskGroup } from '../../../types/task.types';

export default function TasksPage() {
  const { showToast } = useToast();
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Mock data for development
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Design Homepage',
      description: 'Create initial design mockups for the homepage',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        id: 'p1',
        name: 'Website Redesign',
        color: '#3b82f6',
      },
      assignee: {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    {
      id: '2',
      title: 'API Documentation',
      description: 'Document the new API endpoints',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        id: 'p2',
        name: 'API Development',
        color: '#10b981',
      },
      assignee: {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    {
      id: '3',
      title: 'Fix Login Bug',
      description: 'Users unable to login with Google',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        id: 'p3',
        name: 'Bug Fixes',
        color: '#ef4444',
      },
      assignee: {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
  ];

  // Fetch tasks assigned to the current user
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      // In development, use mock data if no token is present
      if (!token || !userStr || process.env.NODE_ENV === 'development') {
        console.log('Using mock tasks data');
        const tasks = mockTasks;
        
        // Group tasks by project
        const grouped = tasks.reduce<{[key: string]: TaskGroup}>((groups, task) => {
          const projectId = task.project.id;
          if (!groups[projectId]) {
            groups[projectId] = {
              projectId: task.project.id,
              projectName: task.project.name,
              projectColor: task.project.color,
              tasks: [],
            };
          }
          
          groups[projectId].tasks.push(task);
          return groups;
        }, {});
      
        setTaskGroups(Object.values(grouped));
        setIsLoading(false);
        return;
      }

      // In production or with a token, try to fetch from the API
      try {
        const user = JSON.parse(userStr);
        const response = await fetch(
          `http://localhost:4000/api/tasks/assigned/${user.id}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch tasks');
        }
        
        const tasks: Task[] = await response.json();
        
        // Group tasks by project
        const grouped = tasks.reduce<{[key: string]: TaskGroup}>((groups, task) => {
          const projectId = task.project.id;
          if (!groups[projectId]) {
            groups[projectId] = {
              projectId: task.project.id,
              projectName: task.project.name,
              projectColor: task.project.color,
              tasks: [],
            };
          }
          
          groups[projectId].tasks.push(task);
          return groups;
        }, {});
        
        setTaskGroups(Object.values(grouped));
      } catch (error) {
        console.error('Error fetching tasks:', error);
        showToast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load tasks',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks().catch((error) => {
      console.error('Unhandled error in fetchTasks:', error);
      setIsLoading(false);
    });
  }, [showToast]);

  const filteredTaskGroups = taskGroups.map(group => ({
    ...group,
    tasks: group.tasks.filter(task => {
      // Filter by search query
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      // Filter by priority
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
  })).filter(group => group.tasks.length > 0); // Remove empty groups

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'IN_REVIEW':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'BLOCKED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (priority) {
      case 'URGENT':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Urgent</span>;
      case 'HIGH':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>High</span>;
      case 'MEDIUM':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium</span>;
      case 'LOW':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Low</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>None</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? 'Loading...' : `${filteredTaskGroups.flatMap(g => g.tasks).length} task${filteredTaskGroups.flatMap(g => g.tasks).length !== 1 ? 's' : ''} across ${filteredTaskGroups.length} project${filteredTaskGroups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          
          <select
            className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        /* Tasks by Project */
        <div className="space-y-8">
          {filteredTaskGroups.length > 0 ? (
            filteredTaskGroups.map((group) => (
              <motion.div 
                key={group.projectId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg border overflow-hidden"
              >
                <div 
                  className="px-6 py-4 border-b flex items-center gap-3"
                  style={{ borderLeft: `4px solid ${group.projectColor || '#4F46E5'}` }}
                >
                  <h2 className="text-lg font-semibold text-foreground">{group.projectName}</h2>
                  <span className="text-sm text-muted-foreground">
                    {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <ul className="divide-y divide-border">
                  <AnimatePresence>
                    {group.tasks.map((task) => (
                      <motion.li 
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <div className="px-6 py-4 flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <button className="p-1 rounded-full hover:bg-muted">
                              {getStatusIcon(task.status)}
                            </button>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">
                                {task.title}
                              </p>
                              {task.priority && (
                                <div className="flex-shrink-0">
                                  {getPriorityBadge(task.priority)}
                                </div>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                              
                              {task.labels && task.labels.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="flex -space-x-1">
                                    {task.labels.slice(0, 3).map((label) => (
                                      <span 
                                        key={label.id}
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: label.color }}
                                        title={label.name}
                                      />
                                    ))}
                                    {task.labels.length > 3 && (
                                      <span className="h-3 px-1.5 flex items-center justify-center text-xs bg-muted rounded-full">
                                        +{task.labels.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 border-2 border-dashed rounded-xl"
            >
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You\'re all caught up! No tasks assigned to you.'}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
