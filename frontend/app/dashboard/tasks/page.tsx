'use client';

import { useState, useEffect } from 'react';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { Task } from '@/types/task';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks from the API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleTaskUpdate = async (updatedTasks: Task[]) => {
    try {
      setTasks(updatedTasks);
      
      // Update the order on the server
      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: updatedTasks.map((task, index) => ({
            id: task.id,
            position: index,
          })),
        }),
      });
    } catch (error) {
      console.error('Error updating task order:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    // Handle task click (e.g., open task details in a modal or new page)
    console.log('Task clicked:', task);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Board</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
          + New Task
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {tasks.length > 0 ? (
          <TaskBoard 
            tasks={tasks} 
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks found. Create your first task to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
