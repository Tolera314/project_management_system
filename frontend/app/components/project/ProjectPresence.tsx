'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/app/hooks/useSocket';
import UserAvatar from '../shared/UserAvatar';

interface ProjectMember {
    id: string; // This is usually projectMemberId
    organizationMember: {
        userId: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            avatarUrl?: string | null;
        }
    }
}

interface ProjectPresenceProps {
    projectId: string;
    members: ProjectMember[];
}

export default function ProjectPresence({ projectId, members }: ProjectPresenceProps) {
    const socket = useSocket();
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

    // Safety check for members
    const safeMembers = Array.isArray(members) ? members : [];

    useEffect(() => {
        if (!socket) return;

        // Join the project room
        socket.emit('join-project', projectId);

        const handlePresenceUpdate = (userIds: string[]) => {
            setOnlineUserIds(userIds);
        };

        socket.on('presence-update', handlePresenceUpdate);

        return () => {
            socket.emit('leave-project', projectId);
            socket.off('presence-update', handlePresenceUpdate);
        };
    }, [socket, projectId]);

    useEffect(() => {
        // Retry connection logic if socket reconnects
        if (socket?.connected) {
            socket.emit('join-project', projectId);
        }
    }, [socket?.connected, projectId]);

    // Map online user IDs to member details
    const onlineMembers = onlineUserIds
        .map(userId => safeMembers.find(m => m.organizationMember?.userId === userId))
        .filter((m): m is ProjectMember => !!m);

    // Limit display to 3-5 users
    const displayMembers = onlineMembers.slice(0, 5);
    const overflow = onlineMembers.length - 5;

    if (onlineMembers.length === 0) return null;

    return (
        <div className="flex items-center -space-x-2 mr-4">
            {displayMembers.map((member) => (
                <div
                    key={member.organizationMember.userId}
                    className="relative transition-transform hover:z-10 hover:scale-105 cursor-help"
                    title={`${member.organizationMember.user.firstName} is online`}
                >
                    <div className="ring-2 ring-background rounded-full relative">
                        <UserAvatar
                            userId={member.organizationMember.user.id}
                            firstName={member.organizationMember.user.firstName}
                            lastName={member.organizationMember.user.lastName}
                            avatarUrl={member.organizationMember.user.avatarUrl}
                            size="sm"
                            className="w-6 h-6 text-[10px]"
                        />
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-background rounded-full block"></span>
                    </div>
                </div>
            ))}
            {overflow > 0 && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-hover ring-2 ring-background text-[10px] font-medium text-text-secondary z-0">
                    +{overflow}
                </div>
            )}
        </div>
    );
}
