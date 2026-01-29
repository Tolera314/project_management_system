'use client';

import { useState } from 'react';
import { Clock, Play, Pause, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeEntry {
    id: string;
    description: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    billable: boolean;
}

interface TimeTrackingProps {
    taskId: string;
    onSave?: () => void;
}

export default function TimeTrackingSection({ taskId, onSave }: TimeTrackingProps) {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [currentEntry, setCurrentEntry] = useState<Partial<TimeEntry>>({
        description: '',
        billable: false
    });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

    const startTimer = () => {
        const newEntry = {
            ...currentEntry,
            startTime: new Date(),
        };
        setCurrentEntry(newEntry);
        setIsTracking(true);
        setElapsedSeconds(0);

        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);
    };

    const stopTimer = async () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - (currentEntry.startTime?.getTime() || 0)) / 1000 / 60); // minutes

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/tasks/${taskId}/time-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description: currentEntry.description,
                    startTime: currentEntry.startTime,
                    endTime,
                    duration,
                    billable: currentEntry.billable
                })
            });

            if (response.ok) {
                const savedEntry = await response.json();
                setEntries(prev => [savedEntry, ...prev]);
                setCurrentEntry({ description: '', billable: false });
                setIsTracking(false);
                setElapsedSeconds(0);
                onSave?.();
            }
        } catch (error) {
            console.error('Failed to save time entry:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (minutes: number) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    // Load entries on mount
    useState(() => {
        const loadEntries = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:4000/tasks/${taskId}/time-entries`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setEntries(data.entries || []);
                }
            } catch (error) {
                console.error('Failed to load time entries:', error);
            }
        };
        loadEntries();
    });

    return (
        <div className="space-y-4">
            {/* Timer Controls */}
            <div className="bg-surface/50 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <Clock size={16} />
                    <span>Time Tracker</span>
                </div>

                {isTracking && (
                    <div className="text-center">
                        <div className="text-3xl font-mono font-bold text-primary mb-2">
                            {formatTime(elapsedSeconds)}
                        </div>
                    </div>
                )}

                <input
                    type="text"
                    placeholder="What are you working on?"
                    value={currentEntry.description || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isTracking}
                    className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                />

                <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                        <input
                            type="checkbox"
                            checked={currentEntry.billable || false}
                            onChange={(e) => setCurrentEntry(prev => ({ ...prev, billable: e.target.checked }))}
                            disabled={isTracking}
                            className="w-4 h-4 rounded border-white/20 bg-background/50 checked:bg-primary"
                        />
                        Billable
                    </label>

                    {!isTracking ? (
                        <button
                            onClick={startTimer}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Play size={14} />
                            Start Timer
                        </button>
                    ) : (
                        <button
                            onClick={stopTimer}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Pause size={14} />
                            Stop & Save
                        </button>
                    )}
                </div>
            </div>

            {/* Time Entries List */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Time Entries</h4>
                {entries.length === 0 ? (
                    <p className="text-xs text-text-secondary/50 text-center py-4">No time entries yet</p>
                ) : (
                    <div className="space-y-2">
                        {entries.map(entry => (
                            <div
                                key={entry.id}
                                className="bg-surface/30 border border-white/5 rounded-lg p-3 flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">
                                        {entry.description || 'No description'}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {new Date(entry.startTime).toLocaleDateString()} • {formatDuration(entry.duration || 0)}
                                        {entry.billable && <span className="ml-2 text-emerald-400">💰 Billable</span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
