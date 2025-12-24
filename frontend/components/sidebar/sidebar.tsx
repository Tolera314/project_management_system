'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, List, CheckSquare, Flag, Users, Settings, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'My Work', icon: CheckSquare, href: '/my-work' },
  { name: 'Projects', icon: List, href: '/projects' },
  { name: 'Goals', icon: Flag, href: '/goals' },
  { name: 'Team', icon: Users, href: '/team' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    projects: true,
    teams: true,
  });
  const pathname = usePathname();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">ProjectFlow</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 px-3">
          <button
            onClick={() => toggleSection('projects')}
            className="flex items-center w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
          >
            {expandedSections.projects ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            Projects
          </button>
          
          {expandedSections.projects && (
            <div className="ml-6 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
              {/* Add project list here */}
              <div className="text-sm text-gray-600 px-2 py-1">My Projects</div>
              <div className="text-sm text-gray-600 px-2 py-1">Team Projects</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
            <span className="text-indigo-600 text-sm font-medium">U</span>
          </div>
          <div className="text-sm">
            <div className="font-medium">User Name</div>
            <div className="text-gray-500">user@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
