import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'My Work',
  description: 'Your tasks and activities in one place',
};

interface Activity {
  id: string;
  initials: string;
  message: string;
  time: string;
}

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
}

export default function MyWorkPage() {
  // TODO: Fetch user's tasks and projects from API
  const tasks: any[] = [];
  const recentActivity: Activity[] = [];
  const upcomingDeadlines: Deadline[] = [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Work</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <ListTodo className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Tasks Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Total tasks</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-center">
                  <div className="font-semibold">3</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-center">
                  <div className="font-semibold">5</div>
                  <div className="text-xs text-muted-foreground">Due Soon</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-center">
                  <div className="font-semibold">4</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs">{activity.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {deadline.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListTodo className="mr-2 h-5 w-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {/* Task items will be rendered here */}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListTodo className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No tasks assigned</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new task
              </p>
              <div className="mt-6">
                <Button>
                  <ListTodo className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
