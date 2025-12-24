import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, Trophy, Flag, ChevronRight, MoreHorizontal, Check, Circle, Search, Filter, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const metadata: Metadata = {
  title: 'Goals',
  description: 'Track and manage your team goals',
};

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  status: 'on-track' | 'at-risk' | 'off-track' | 'completed';
  dueDate: string;
  owner: {
    name: string;
    avatar?: string;
  };
  keyResults: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

export default function GoalsPage() {
  // Mock data - replace with real data from your API
  const goals: Goal[] = [
    {
      id: '1',
      title: 'Increase Monthly Active Users',
      description: 'Grow our user base by improving engagement and retention',
      progress: 65,
      target: 10000,
      unit: 'users',
      status: 'on-track',
      dueDate: '2025-12-31',
      owner: { name: 'Growth Team' },
      keyResults: [
        { id: '1-1', title: 'Improve onboarding completion rate to 80%', completed: true },
        { id: '1-2', title: 'Reduce churn rate to <2% monthly', completed: true },
        { id: '1-3', title: 'Launch referral program', completed: false },
      ],
    },
    {
      id: '2',
      title: 'Achieve 99.9% Uptime',
      description: 'Ensure maximum reliability and minimal downtime',
      progress: 92,
      target: 100,
      unit: '%',
      status: 'at-risk',
      dueDate: '2025-12-31',
      owner: { name: 'DevOps Team' },
      keyResults: [
        { id: '2-1', title: 'Implement comprehensive monitoring', completed: true },
        { id: '2-2', title: 'Set up automated alerts', completed: true },
        { id: '2-3', title: 'Reduce incident response time to <15min', completed: false },
      ],
    },
    {
      id: '3',
      title: 'Launch Mobile App',
      description: 'Release a fully functional mobile application',
      progress: 30,
      target: 100,
      unit: '%',
      status: 'off-track',
      dueDate: '2025-12-31',
      owner: { name: 'Mobile Team' },
      keyResults: [
        { id: '3-1', title: 'Complete UI/UX designs', completed: true },
        { id: '3-2', title: 'Develop core features', completed: false },
        { id: '3-3', title: 'Complete beta testing', completed: false },
      ],
    },
  ];

  const statusColors = {
    'on-track': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'at-risk': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'off-track': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  const statusIcons = {
    'on-track': <Check className="h-4 w-4" />,
    'at-risk': <Flag className="h-4 w-4" />,
    'off-track': <Circle className="h-4 w-4" />,
    'completed': <Trophy className="h-4 w-4" />,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Track and manage your team's objectives and key results</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search goals..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Statuses</DropdownMenuItem>
              <DropdownMenuItem>On Track</DropdownMenuItem>
              <DropdownMenuItem>At Risk</DropdownMenuItem>
              <DropdownMenuItem>Off Track</DropdownMenuItem>
              <DropdownMenuItem>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                Timeframe
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>This Quarter</DropdownMenuItem>
              <DropdownMenuItem>Next Quarter</DropdownMenuItem>
              <DropdownMenuItem>This Year</DropdownMenuItem>
              <DropdownMenuItem>Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    goal.status === 'on-track' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    goal.status === 'at-risk' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                    goal.status === 'off-track' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {statusIcons[goal.status]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription className="mt-1">{goal.description}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded-md hover:bg-muted">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Goal</DropdownMenuItem>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {goal.progress}{goal.unit} of {goal.target}{goal.unit} • {Math.round((goal.progress / (goal.target || 1)) * 100)}%
                    </span>
                    <Badge variant="outline" className={statusColors[goal.status]}>
                      {goal.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                  </div>
                  <Progress value={goal.progress} max={goal.target} className="h-2" />
                </div>

                {/* Key Results */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Results</h4>
                  <div className="space-y-2">
                    {goal.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-center space-x-3">
                        <button className="h-4 w-4 rounded border flex items-center justify-center">
                          {kr.completed && <Check className="h-3 w-3" />}
                        </button>
                        <span className={`text-sm ${kr.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {kr.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{goal.owner.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
