import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({ task, onClick, className = '' }: TaskCardProps) {
  return (
    <Card 
      className={`mb-2 cursor-pointer hover:bg-accent/50 transition-colors ${className}`}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex -space-x-2">
          {task.assignees?.slice(0, 3).map((assignee) => (
            <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={assignee.user.avatarUrl} alt={assignee.user.name} />
              <AvatarFallback>
                {assignee.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assignees?.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
