import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { ReactNode, useState } from 'react';

// Simple draggable item component
export function DraggableItem({ 
  id, 
  children,
  className = '' 
}: { 
  id: string; 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div 
      data-draggable-id={id}
      className={`relative ${className}`}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  );
}

// Sortable list component
export function SortableList<T extends { id: string }>({
  items,
  renderItem,
  onDragEnd,
  id = 'sortable-list',
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  onDragEnd?: (items: T[]) => void;
  id?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex);
      onDragEnd?.(newItems);
    }
    
    setActiveId(null);
  };

  return (
    <DndContext
      id={id}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {items.map((item) => (
          <div key={item.id} data-id={item.id}>
            {renderItem(item)}
          </div>
        ))}
      </SortableContext>
    </DndContext>
  );
}

// Utility function to create a sortable item
export function createSortableItem<T extends { id: string }>(Component: React.ComponentType<{ item: T }>) {
  return function SortableItem({ item }: { item: T }) {
    return (
      <DraggableItem id={item.id}>
        <Component item={item} />
      </DraggableItem>
    );
  };
}
