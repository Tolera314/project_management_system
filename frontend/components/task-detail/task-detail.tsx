'use client';

import { useState } from 'react';
import { X, MessageSquare, Paperclip, Clock, Tag, User, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
}

import { Task } from '@/types/task';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onTaskUpdate: (updatedTask: Task) => void;
}

export function TaskDetail({ task, onClose, onTaskUpdate }: TaskDetailProps) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  
  const handleSave = () => {
    const updatedTask = {
      ...task,
      title: editedTitle,
      description: editedDescription,
      updatedAt: new Date().toISOString()
    };
    onTaskUpdate(updatedTask);
    setIsEditing(false);
  };

  const handleAddComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      user: {
        name: 'Current User',
      },
      content: comment,
      timestamp: new Date().toISOString(),
    };
    
    setComments([...comments, newComment]);
    setComment('');
  };

  const handleSaveChanges = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Here you would typically update the task in your state/API
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">TASK-{task.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold w-full p-1 border rounded"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-bold">{task.title}</h2>
            )}
            {isEditing && (
              <div className="flex space-x-2 mt-2">
                <Button onClick={handleSave} size="sm">Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                  Cancel
                </Button>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span>Created on {new Date(task.createdAt).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Description
                </h3>
                {isEditing ? (
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p 
                    className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded"
                    onClick={() => setIsEditing(true)}
                  >
                    {editedDescription || 'Add a description...'}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments ({comments.length})
                </h3>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar>
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback>
                          {comment.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{comment.user.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="mt-4">
                  <Textarea
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button type="submit" size="sm">
                      Comment
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                    </div>
                    <div className="text-sm">
                      {task.dueDate ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                      <User className="h-3.5 w-3.5 mr-1.5" />
                      Assignee
                    </div>
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="space-y-2">
                        {task.assignees.map(assignee => (
                          <div key={assignee.id} className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={assignee.user.avatarUrl} />
                              <AvatarFallback>
                                {assignee.user.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee.user.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Assign
                      </Button>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-1.5" />
                      Labels
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                        Feature
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-xs">U</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">You</span> created this task
                      <div className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {task.updatedAt !== task.createdAt && (
                    <div className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs">U</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">You</span> updated this task
                        <div className="text-xs text-gray-500">
                          {new Date(task.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-2" />
              Labels
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {isEditing && (
              <Button size="sm" onClick={handleSaveChanges}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
