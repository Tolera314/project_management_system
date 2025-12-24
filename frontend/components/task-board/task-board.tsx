'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'done';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee?: {
    name: string;
    avatar?: string;
  };
  dueDate?: string;
}

interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

const initialData: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      {
        id: '1',
        title: 'Design new dashboard layout',
        description: 'Create wireframes for the new dashboard design',
        status: 'todo',
        priority: 'high',
        assignee: { name: 'Alex Johnson' },
        dueDate: '2025-12-30',
      },
      {
        id: '2',
        title: 'Update user profile page',
        description: 'Add new fields to the user profile page',
        status: 'todo',
        priority: 'medium',
        dueDate: '2025-12-28',
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [
      {
        id: '3',
        title: 'Implement authentication',
        description: 'Set up JWT authentication',
        status: 'in-progress',
        priority: 'high',
        assignee: { name: 'Sam Wilson' },
      },
    ],
  },
  {
    id: 'in-review',
    title: 'In Review',
    tasks: [
      {
        id: '4',
        title: 'Fix navigation bugs',
        description: 'Fix issues with mobile navigation menu',
        status: 'in-review',
        priority: 'medium',
        assignee: { name: 'Taylor Swift' },
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      {
        id: '5',
        title: 'Set up project structure',
        description: 'Initialize Next.js project with TypeScript',
        status: 'done',
        priority: 'low',
      },
    ],
  },
];

interface TaskBoardProps {
  onTaskClick: (task: any) => void;
}

export function TaskBoard({ onTaskClick }: TaskBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialData);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // If dropped in the same column
    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceColumn.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      setColumns(columns.map(column => {
        if (column.id === source.droppableId) {
          return { ...column, tasks: newTasks };
        }
        return column;
      }));
    } else {
      // Moving to a different column
      const sourceTasks = Array.from(sourceColumn.tasks);
      const destTasks = Array.from(destColumn.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      // Update the status of the moved task
      movedTask.status = destColumn.id as TaskStatus;
      destTasks.splice(destination.index, 0, movedTask);

      setColumns(columns.map(column => {
        if (column.id === source.droppableId) {
          return { ...column, tasks: sourceTasks };
        }
        if (column.id === destination.droppableId) {
          return { ...column, tasks: destTasks };
        }
        return column;
      }));
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4 overflow-x-auto p-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm text-gray-700">{column.title} ({column.tasks.length})</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2 min-h-[50px]"
                >
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                          className="bg-white rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            {task.dueDate && (
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                            {task.assignee && (
                              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                {task.assignee.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-500 hover:bg-gray-100 mt-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
