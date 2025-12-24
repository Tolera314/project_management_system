'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar/sidebar';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetail } from '@/components/task-detail/task-detail';
import { Button } from '@/components/ui/button';
import { Plus, Menu } from 'lucide-react';
import { mockTasks } from '@/lib/mock-tasks';
import { Task } from '@/types/task';
import { ViewToggle, ViewType } from '@/components/view-toggle';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [currentView, setCurrentView] = useState<ViewType>('board');

  const handleTaskUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">My Workspace</h1>
            </div>
            <div className="flex-1 flex justify-center">
              <ViewToggle 
                onViewChange={setCurrentView} 
                defaultView={currentView}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-sm font-medium">U</span>
              </div>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            <button className="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-500">
              Board
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              List
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Calendar
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Table
            </button>
          </div>
        </header>

        {/* Task Board */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Active Tasks</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Sort
                </Button>
              </div>
            </div>
            
            {/* Task Content */}
            <div className="flex-1 overflow-auto p-4">
              {currentView === 'board' && (
                <TaskBoard 
                  tasks={tasks} 
                  onTaskUpdate={handleTaskUpdate}
                  onTaskClick={handleTaskClick}
                />
              )}
              
              {currentView === 'list' && (
                <div className="max-w-4xl mx-auto">
                  <TaskList 
                    tasks={tasks}
                    onTaskClick={handleTaskClick}
                  />
                </div>
              )}
              
              {(currentView === 'calendar' || currentView === 'table') && (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    {currentView === 'calendar' ? 'Calendar' : 'Table'} view is coming soon!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Task Detail View */}
      {selectedTask && (
        <TaskDetail 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
        />
      )}
    </div>
  );
}
