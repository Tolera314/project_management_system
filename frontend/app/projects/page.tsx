import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Folder, Star, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage and track your projects',
};

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  progress: number;
  favorite: boolean;
  updatedAt: string;
  team: {
    name: string;
    avatar?: string;
  };
}

export default function ProjectsPage() {
  // Mock data - replace with real data from your API
  const projects: Project[] = [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      status: 'active',
      progress: 65,
      favorite: true,
      updatedAt: '2025-12-20T14:30:00Z',
      team: { name: 'Design Team' }
    },
    {
      id: '2',
      name: 'Mobile App Development',
      description: 'New mobile application for iOS and Android platforms',
      status: 'active',
      progress: 30,
      favorite: false,
      updatedAt: '2025-12-22T09:15:00Z',
      team: { name: 'Mobile Team' }
    },
    {
      id: '3',
      name: 'API Integration',
      description: 'Integrate third-party services with our backend',
      status: 'on-hold',
      progress: 15,
      favorite: false,
      updatedAt: '2025-12-18T16:45:00Z',
      team: { name: 'Backend Team' }
    },
    {
      id: '4',
      name: 'Marketing Campaign Q1',
      description: 'Launch new marketing campaign for Q1 2026',
      status: 'planning',
      progress: 10,
      favorite: true,
      updatedAt: '2025-12-15T11:20:00Z',
      team: { name: 'Marketing' }
    },
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'on-hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    planning: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and track your team's projects</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Active</DropdownMenuItem>
            <DropdownMenuItem>Completed</DropdownMenuItem>
            <DropdownMenuItem>On Hold</DropdownMenuItem>
            <DropdownMenuItem>Planning</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded-md hover:bg-muted">
                    <Star 
                      className={`h-4 w-4 ${project.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                    />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 rounded-md hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <Badge variant="outline" className={statusColors[project.status]}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                  </Badge>
                  <div className="text-muted-foreground text-xs">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
