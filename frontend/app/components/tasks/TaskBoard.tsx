'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { Task, List, TaskStatusEnum, Priority } from '@/app/types/task';
import { TaskList } from './TaskList';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { getTasks, updateTaskPosition, updateTask, createTask } from '@/app/lib/api/taskService';
import { useToast } from '@/components/ui/use-toast';

interface TaskBoardProps {
  lists: List[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskCreate: (listId: string) => Promise<void>;
  onListCreate: () => Promise<void>;
  onListUpdate: (listId: string, updates: { name?: string; position?: number }) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

export function TaskBoard({ projectId }: { projectId: string }) {
  const [lists, setLists] = useState<List[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch tasks when the component mounts or projectId changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const tasks = await getTasks({ projectId });
        // Group tasks by list
        const listsMap = new Map<string, List>();
        
        tasks.forEach(task => {
          if (!listsMap.has(task.listId)) {
            listsMap.set(task.listId, {
              id: task.listId,
              name: `List ${task.listId.slice(0, 4)}`, // Default name, replace with actual list name
              position: 0, // You might want to fetch this from the backend
              projectId,
              tasks: [],
            });
          }
          const list = listsMap.get(task.listId)!;
          list.tasks.push(task);
        });

        // Sort lists by position and tasks by position
        const sortedLists = Array.from(listsMap.values())
          .sort((a, b) => a.position - b.position)
          .map(list => ({
            ...list,
            tasks: list.tasks.sort((a, b) => a.position - b.position),
          }));

        setLists(sortedLists);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tasks',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId, toast]);

  // Get all task IDs for DnD context
  const taskIds = useMemo(() => {
    return lists.flatMap((list) => list.tasks.map((task) => task.id));
  }, [lists]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    // Check if we're dragging a task
    const task = lists
      .flatMap((list) => list.tasks)
      .find((t) => t.id === active.id);
      
    if (task) {
      setActiveTask(task);
      return;
    }
    
    // Check if we're dragging a list
    const list = lists.find((l) => l.id === active.id);
    if (list) {
      setActiveList(list);
    }
  }, [lists]);

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // If we're dragging a task
    if (active.data.current?.type === 'task') {
      const activeListId = active.data.current.listId;
      const overListId = over.data.current?.listId || over.id;
      
      // If dropping on a list
      if (over.data.current?.type === 'list' || over.data.current?.type === 'task') {
        setLists((prevLists) => {
          const activeListIndex = prevLists.findIndex((list) => list.id === activeListId);
          const overListIndex = prevLists.findIndex((list) => list.id === overListId);
          
          if (activeListIndex === -1 || overListIndex === -1) return prevLists;
          
          const activeList = { ...prevLists[activeListIndex] };
          const overList = { ...prevLists[overListIndex] };
          
          // Find the active task
          const activeTaskIndex = activeList.tasks.findIndex((task) => task.id === activeId);
          
          if (activeTaskIndex === -1) return prevLists;
          
          const activeTask = activeList.tasks[activeTaskIndex];
          
          // If moving within the same list
          if (activeListId === overListId) {
            const overTaskIndex = overList.tasks.findIndex((task) => task.id === overId);
            
            if (overTaskIndex === -1) return prevLists;
            
            const newTasks = arrayMove(activeList.tasks, activeTaskIndex, overTaskIndex);
            
            // Update positions
            const updatedTasks = newTasks.map((task, index) => ({
              ...task,
              position: index,
            }));
            
            const newLists = [...prevLists];
            newLists[activeListIndex] = {
              ...activeList,
              tasks: updatedTasks,
            };
            
            // Update positions in the backend
            updatedTasks.forEach((task, index) => {
              if (task.position !== index) {
                updateTaskPosition(task.id, task.listId, index).catch(console.error);
              }
            });
            
            return newLists;
          } 
          // Moving to a different list
          else {
            // Remove from active list
            const newActiveListTasks = [...activeList.tasks];
            const [movedTask] = newActiveListTasks.splice(activeTaskIndex, 1);
            
            // Add to over list
            const newOverListTasks = [...overList.tasks];
            const overTaskIndex = overList.tasks.findIndex((task) => task.id === overId);
            const insertIndex = overTaskIndex === -1 ? newOverListTasks.length : overTaskIndex;
            
            const updatedTask = {
              ...movedTask,
              listId: overListId as string,
            };
            
            newOverListTasks.splice(insertIndex, 0, updatedTask);

            const newLists = [...prevLists];
            newLists[activeListIndex] = {
              ...activeList,
              tasks: newActiveListTasks,
            };
            
            const finalOverListTasks = newOverListTasks.map((task, index) => ({
              ...task,
              position: index,
            }));
            
            newLists[overListIndex] = {
              ...overList,
              tasks: finalOverListTasks,
            };

            // Update the task's list and position in the backend
            updateTask(updatedTask.id, {
              listId: overListId as string,
              position: insertIndex,
            }).catch(error => {
              console.error('Error updating task list:', error);
              toast({
                title: 'Error',
                description: 'Failed to move task',
                variant: 'destructive',
              });
            });

            // Update positions in the target list
            finalOverListTasks.forEach((task, index) => {
              if (task.position !== index) {
                updateTaskPosition(task.id, task.listId, index).catch(console.error);
              }
            });

            return newLists;
          }
        });
      }
    }
  }, [toast]);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    try {
      // Handle task reordering within the same list
      if (active.data.current?.type === 'task' && over.data.current?.type === 'task') {
        const activeListId = active.data.current.listId;
        const overListId = over.data.current.listId;

        if (activeListId !== overListId) return;

        setLists((prevLists) => {
          const listIndex = prevLists.findIndex((list) => list.id === activeListId);
          if (listIndex === -1) return prevLists;

          const list = { ...prevLists[listIndex] };
          const oldIndex = list.tasks.findIndex((t) => t.id === active.id);
          const newIndex = list.tasks.findIndex((t) => t.id === over.id);

          if (oldIndex === -1 || newIndex === -1) return prevLists;

          const newTasks = arrayMove(list.tasks, oldIndex, newIndex);
          
          // Update positions
          const updatedTasks = newTasks.map((task, index) => ({
            ...task,
            position: index,
          }));

          const newLists = [...prevLists];
          newLists[listIndex] = {
            ...list,
            tasks: updatedTasks,
          };

          // Update positions in the backend
          updatedTasks.forEach((task, index) => {
            if (task.position !== index) {
              updateTaskPosition(task.id, task.listId, index).catch(console.error);
            }
          });

          return newLists;
        });
      }
    } catch (error) {
      console.error('Error updating task position:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task position',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Handle task creation
  const handleTaskCreate = useCallback(async (listId: string) => {
    try {
      const newTask = await createTask({
        title: 'New Task',
        listId,
        projectId,
        status: TaskStatusEnum.TODO,
        priority: Priority.MEDIUM,
      });

      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? { 
                ...list, 
                tasks: [...list.tasks, { ...newTask, assignees: [], comments: [], attachments: [] }] 
              }
            : list
        )
      );
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  }, [projectId, toast]);

  // Handle task status update
  const handleTaskStatusUpdate = useCallback(async (taskId: string, statusId: string | null) => {
    setLists((prevLists) => {
      return prevLists.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) =>
          task.id === taskId ? { ...task, statusId } : task
        ),
      }));
    });
    
    await updateTask(taskId, { statusId });
  }, []);

  return (
    <div className="flex h-full w-full overflow-x-auto pb-4">
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <SortableContext items={lists.map((list) => list.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex space-x-4">
            {lists.map((list) => (
              <TaskList
                key={list.id}
                list={list}
                onTaskClick={onTaskClick}
                onTaskCreate={() => handleTaskCreate(list.id)}
                onTaskStatusUpdate={handleTaskStatusUpdate}
              />
            ))}
            
            <div className="w-64 flex-shrink-0">
              <Button
                variant="outline"
                className="h-12 w-full justify-start text-muted-foreground"
                onClick={onListCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another list
              </Button>
            </div>
          </div>
        </SortableContext>

        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeTask && (
                <div className="w-64">
                  <TaskCard 
                    task={activeTask} 
                    className="shadow-xl ring-2 ring-primary"
                  />
                </div>
              )}
              {activeList && (
                <div className="w-64 rounded-lg border bg-background p-4 shadow-md">
                  <h3 className="font-medium">{activeList.name}</h3>
                </div>
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
}
