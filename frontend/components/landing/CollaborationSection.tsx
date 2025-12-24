import React from 'react';
import { Users, MessageSquare, GitBranch } from 'lucide-react';

export default function CollaborationSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Seamless Team Collaboration
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Work together efficiently with real-time updates and team features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Workspaces</h3>
            <p className="text-gray-600">
              Create dedicated workspaces for your teams to organize projects and tasks efficiently.
            </p>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">
              Communicate instantly with your team members through integrated chat functionality.
            </p>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Task Dependencies</h3>
            <p className="text-gray-600">
              Define task relationships and dependencies to streamline your workflow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
