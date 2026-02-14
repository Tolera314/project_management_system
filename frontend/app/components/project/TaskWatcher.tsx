'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface TaskWatcherProps {
    taskId: string;
    userId: string;
    initialIsWatching?: boolean;
}

export default function TaskWatcher({ taskId, userId, initialIsWatching = false }: TaskWatcherProps) {
    const [isWatching, setIsWatching] = useState(initialIsWatching);
    const [isLoading, setIsLoading] = useState(false);

    const toggleWatch = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');

            if (isWatching) {
                // Unwatch
                const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/watchers/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    setIsWatching(false);
                }
            } else {
                // Watch
                const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/watchers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId })
                });
                if (response.ok) {
                    setIsWatching(true);
                }
            }
        } catch (error) {
            console.error('Failed to toggle watch:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWatch}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isWatching
                ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
                } disabled:opacity-50`}
            title={isWatching ? 'Stop watching this task' : 'Watch this task for updates'}
        >
            {isWatching ? <Eye size={14} /> : <EyeOff size={14} />}
            {isWatching ? 'Watching' : 'Watch'}
        </button>
    );
}
