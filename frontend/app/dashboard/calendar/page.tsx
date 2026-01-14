'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar as CalendarIcon, List, Grid, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Task } from '../../../types/task.types';

export default function CalendarPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const calendarRef = useRef<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data for development
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Project Kickoff',
      description: 'Initial project kickoff meeting',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        id: 'p1',
        name: 'Website Redesign',
        color: '#3b82f6',
      },
    },
    {
      id: '2',
      title: 'Design Review',
      description: 'Review initial design mockups',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        id: 'p1',
        name: 'Website Redesign',
        color: '#3b82f6',
      },
    },
    {
      id: '3',
      title: 'API Integration',
      description: 'Integrate with backend services',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        id: 'p2',
        name: 'Mobile App',
        color: '#10b981',
      },
    },
  ];

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        // In development, use mock data if no token is present
        if (!token || process.env.NODE_ENV === 'development') {
          console.log('Using mock tasks data');
          const calendarEvents = mockTasks.map(task => ({
            id: task.id,
            title: task.title,
            start: task.dueDate || new Date(),
            end: task.dueDate ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000) : null,
            allDay: !task.dueDate || !task.dueDate.includes('T'),
            extendedProps: {
              status: task.status,
              priority: task.priority,
              description: task.description,
              project: task.project,
            },
            backgroundColor: getEventBackgroundColor(task.status, task.priority),
            borderColor: getEventBorderColor(task.status, task.priority),
            textColor: getTextColor(task.status),
            className: 'task-event',
          }));
          setEvents(calendarEvents);
          return;
        }

        // In production or with a token, try to fetch from the API
        const response = await fetch('http://localhost:4000/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch tasks');
        }
        
        const tasks: Task[] = await response.json();
        
        // Transform tasks to FullCalendar events
        const calendarEvents = tasks.map(task => ({
          id: task.id,
          title: task.title,
          start: task.dueDate || new Date(),
          end: task.dueDate ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000) : null,
          allDay: !task.dueDate || !task.dueDate.includes('T'),
          extendedProps: {
            status: task.status,
            priority: task.priority,
            description: task.description,
            project: task.project,
          },
          backgroundColor: getEventBackgroundColor(task.status, task.priority),
          borderColor: getEventBorderColor(task.status, task.priority),
          textColor: getTextColor(task.status),
          className: 'task-event',
        }));

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        showToast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load calendar',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [showToast]);

  const handleEventClick = (clickInfo: any) => {
    // Navigate to task detail or show a modal
    router.push(`/dashboard/tasks/${clickInfo.event.id}`);
  };

  const handleDateSelect = (selectInfo: any) => {
    // Handle date selection (for creating new events)
    const title = prompt('Please enter a title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
    }
  };

  const handleEventDrop = (dropInfo: any) => {
    // Handle event drop (reschedule)
    updateEvent(dropInfo.event);
  };

  const handleEventResize = (resizeInfo: any) => {
    // Handle event resize (change duration)
    updateEvent(resizeInfo.event);
  };

  const updateEvent = async (event: any) => {
    try {
      const token = localStorage.getItem('token');
      
      // In development, just update the local state
      if (!token || process.env.NODE_ENV === 'development') {
        setEvents(prevEvents => 
          prevEvents.map(evt => 
            evt.id === event.id 
              ? { ...evt, start: event.start, end: event.end }
              : evt
          )
        );
        return;
      }

      // In production or with a token, send the update to the API
      const response = await fetch(`http://localhost:4000/api/tasks/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dueDate: event.start.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update task');
      }

      showToast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const createEventId = () => {
    return String(Math.floor(Math.random() * 1000000));
  };

  const getEventBackgroundColor = (status: string, priority: string) => {
    if (status === 'COMPLETED') return '#D1FAE5';
    
    switch (priority) {
      case 'URGENT': return '#FEE2E2';
      case 'HIGH': return '#FFEDD5';
      case 'MEDIUM': return '#FEF3C7';
      case 'LOW': return '#E0F2FE';
      default: return '#F3F4F6';
    }
  };

  const getEventBorderColor = (status: string, priority: string) => {
    if (status === 'COMPLETED') return '#10B981';
    
    switch (priority) {
      case 'URGENT': return '#EF4444';
      case 'HIGH': return '#F97316';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#0EA5E9';
      default: return '#9CA3AF';
    }
  };

  const getTextColor = (status: string) => {
    if (status === 'COMPLETED') return '#065F46';
    return '#1F2937';
  };

  const renderEventContent = (eventInfo: any) => {
    const { status, priority } = eventInfo.event.extendedProps;
    
    return (
      <div className="p-1">
        <div className="flex items-center gap-1">
          {status === 'COMPLETED' ? (
            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
          ) : status === 'BLOCKED' ? (
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
          ) : (
            <Circle className="h-3 w-3 flex-shrink-0" />
          )}
          <span className="truncate text-xs font-medium">{eventInfo.event.title}</span>
        </div>
        {!eventInfo.event.allDay && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {eventInfo.timeText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            {viewType === 'dayGridMonth' && 'Month view'}
            {viewType === 'timeGridWeek' && 'Week view'}
            {viewType === 'timeGridDay' && 'Day view'}
            {viewType === 'listWeek' && 'Upcoming tasks'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setViewType('dayGridMonth')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                viewType === 'dayGridMonth'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('timeGridWeek')}
              className={`px-3 py-2 text-sm font-medium ${
                viewType === 'timeGridWeek'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewType('timeGridDay')}
              className={`px-3 py-2 text-sm font-medium ${
                viewType === 'timeGridDay'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewType('listWeek')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                viewType === 'listWeek'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              List
            </button>
          </div>
          
          <Button
            onClick={() => {
              // Handle new event button click
              const calendarApi = calendarRef.current?.getApi();
              if (calendarApi) {
                calendarApi.changeView('timeGridDay', new Date());
              }
            }}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 pt-4">
        <div className="h-[calc(100vh-200px)] rounded-lg border bg-card">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={viewType}
            headerToolbar={false}
            height="100%"
            events={events}
            nowIndicator={true}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            initialDate={currentDate}
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventContent={renderEventContent}
            viewDidMount={(view) => {
              setViewType(view.view.type as any);
              setCurrentDate(new Date(view.view.currentStart));
            }}
            datesSet={(dateInfo) => {
              setCurrentDate(new Date(dateInfo.view.currentStart));
            }}
            eventClassNames={(arg) => {
              const { status } = arg.event.extendedProps;
              return [
                'cursor-pointer',
                status === 'COMPLETED' ? 'opacity-70' : '',
                status === 'BLOCKED' ? 'border-dashed' : ''
              ].filter(Boolean);
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={viewType !== 'listWeek'}
            dayHeaderFormat={{ weekday: 'short', month: 'short', day: 'numeric' }}
            titleFormat={{ year: 'numeric', month: 'long' }}
            firstDay={1} // Start week on Monday
          />
        </div>
      </div>
    </div>
  );
}
