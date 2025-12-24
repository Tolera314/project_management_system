'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Calendar, Table } from 'lucide-react';

export type ViewType = 'board' | 'list' | 'calendar' | 'table';

interface ViewToggleProps {
  onViewChange?: (view: ViewType) => void;
  defaultView?: ViewType;
}

export function ViewToggle({ onViewChange, defaultView = 'board' }: ViewToggleProps) {
  const [currentView, setCurrentView] = useState<ViewType>(defaultView);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const viewConfig = [
    { id: 'board', icon: LayoutGrid, label: 'Board' },
    { id: 'list', icon: List, label: 'List' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'table', icon: Table, label: 'Table' },
  ] as const;

  return (
    <div className="flex items-center space-x-1 p-1 bg-muted rounded-lg">
      {viewConfig.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant={currentView === id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleViewChange(id as ViewType)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
