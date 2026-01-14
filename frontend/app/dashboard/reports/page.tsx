'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Calendar, Clock, CheckCircle, AlertTriangle, TrendingUp, List, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ReportData, timeRanges } from '../../../types/report.types';
import dynamic from 'next/dynamic';

// Dynamically import charts with no SSR
const BarChart = dynamic(
  () => import('../../../components/ui/charts/bar-chart').then((mod) => mod.BarChart),
  { ssr: false }
);
const PieChart = dynamic(
  () => import('../../../components/ui/charts/pie-chart').then((mod) => mod.PieChart),
  { ssr: false }
);
const LineChart = dynamic(
  () => import('../../../components/ui/charts/line-chart').then((mod) => mod.LineChart),
  { ssr: false }
);

// Mock data for development
const mockReportData: ReportData = {
  metrics: {
    totalTasks: 124,
    completedTasks: 78,
    inProgressTasks: 32,
    overdueTasks: 14,
    completionRate: 63,
  },
  tasksByStatus: [
    { status: 'Completed', count: 78, color: '#10B981' },
    { status: 'In Progress', count: 32, color: '#3B82F6' },
    { status: 'To Do', count: 14, color: '#6B7280' },
    { status: 'Blocked', count: 5, color: '#EF4444' },
  ],
  tasksByPriority: [
    { priority: 'Urgent', count: 8, color: '#EF4444' },
    { priority: 'High', count: 24, color: '#F59E0B' },
    { priority: 'Medium', count: 45, color: '#3B82F6' },
    { priority: 'Low', count: 47, color: '#10B981' },
  ],
  tasksByProject: [
    { projectId: '1', projectName: 'Website Redesign', totalTasks: 45, completedTasks: 32, color: '#3B82F6' },
    { projectId: '2', projectName: 'Mobile App', totalTasks: 38, completedTasks: 22, color: '#8B5CF6' },
    { projectId: '3', projectName: 'API Development', totalTasks: 28, completedTasks: 18, color: '#10B981' },
    { projectId: '4', projectName: 'Marketing Campaign', totalTasks: 13, completedTasks: 6, color: '#F59E0B' },
  ],
  tasksOverTime: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: Math.floor(Math.random() * 5) + 1,
    created: Math.floor(Math.random() * 3) + 1,
  })),
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch this data from your API
        // const response = await fetch(`/api/reports?timeRange=${timeRange}`);
        // const data = await response.json();
        // setReportData(data);
        
        // For now, use mock data
        setTimeout(() => {
          setReportData(mockReportData);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [timeRange]);

  if (isLoading || !reportData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { metrics, tasksByStatus, tasksByPriority, tasksByProject, tasksOverTime } = reportData;
  const completionRate = Math.round((metrics.completedTasks / metrics.totalTasks) * 100) || 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your team's performance and project metrics</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            By Project
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <List className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completedTasks} completed • {metrics.inProgressTasks} in progress
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.overdueTasks / metrics.totalTasks) * 100)}% of total tasks
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Trend</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12%</div>
                <p className="text-xs text-muted-foreground">
                  vs previous period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <PieChart data={tasksByStatus} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <BarChart data={tasksByPriority} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChart data={tasksOverTime} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <h2 className="text-xl font-semibold">Project Performance</h2>
          <div className="space-y-4">
            {tasksByProject.map((project) => {
              const projectCompletion = Math.round((project.completedTasks / project.totalTasks) * 100);
              
              return (
                <Card key={project.projectId}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{project.projectName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {project.completedTasks} of {project.totalTasks} tasks completed
                        </p>
                      </div>
                      <span className="text-sm font-medium">{projectCompletion}%</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${projectCompletion}%`,
                          backgroundColor: project.color 
                        }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
