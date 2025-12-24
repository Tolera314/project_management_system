import React, { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (updatedTasks: Task[]) => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskBoard({ tasks, onTaskUpdate, onTaskClick }: TaskBoardProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      // Update positions based on the new order
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        position: index,
      }));
      onTaskUpdate(updatedTasks);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <div 
              key={task.id} 
              data-id={task.id}
              className="cursor-move"
              onClick={() => handleTaskClick(task)}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
