import { Task, TaskStatusDefinition } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MessageSquare, Paperclip } from 'lucide-react';
import { TaskPriority } from '@/types/task';

interface TaskCardProps {
  task: Task & {
    statusDef?: TaskStatusDefinition | null;
    assignees: Array<{
      id: string;
      user: {
        id: string;
        name: string;
        image: string | null;
      };
    }>;
    _count?: {
      comments: number;
      files: number;
    };
  };
  onClick?: () => void;
  className?: string;
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const priority = (task.priority as TaskPriority) || 'MEDIUM';
  const hasAssignees = task.assignees.length > 0;
  const hasComments = task._count?.comments > 0;
  const hasAttachments = task._count?.files > 0;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'w-full cursor-pointer transition-all hover:shadow-md dark:hover:border-gray-600',
        className
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              // Handle task menu
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {task.dueDate && (
          <div className="mb-3 text-sm text-muted-foreground">
            {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.statusDef && (
              <Badge 
                variant="outline" 
                className="text-xs" 
                style={{ 
                  backgroundColor: `${task.statusDef.color}20`, 
                  borderColor: task.statusDef.color,
                  color: task.statusDef.color
                }}
              >
                {task.statusDef.name}
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-xs', priorityColors[priority])}>
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </Badge>
          </div>

          <div className="flex items-center space-x-1">
            {hasComments && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                <span>{task._count?.comments}</span>
              </div>
            )}
            {hasAttachments && (
              <div className="ml-2 flex items-center text-xs text-muted-foreground">
                <Paperclip className="mr-1 h-3.5 w-3.5" />
                <span>{task._count?.files}</span>
              </div>
            )}
          </div>
        </div>

        {hasAssignees && (
          <div className="mt-3 flex -space-x-2">
            {task.assignees.map((assignee) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={assignee.user.image || undefined} alt={assignee.user.name} />
                <AvatarFallback>
                  {assignee.user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
