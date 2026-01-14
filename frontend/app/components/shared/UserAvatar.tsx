'use client';

import { useUser } from '../../context/UserContext';

interface UserAvatarProps {
    userId?: string;
    firstName?: string;
    lastName?: string;
    email?: string; // fallback if needed
    avatarUrl?: string | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function UserAvatar({
    userId,
    firstName = '?',
    lastName = '',
    avatarUrl,
    className = '',
    size = 'md'
}: UserAvatarProps) {
    const { user } = useUser();

    // If this avatar represents the current user, use the live data from context
    const isCurrentUser = user && userId === user.id;
    const finalAvatarUrl = isCurrentUser ? user.avatarUrl : avatarUrl;
    const finalFirstName = isCurrentUser ? user.firstName : firstName;
    // const finalLastName = isCurrentUser ? user.lastName : lastName; // Optional: update name too

    const initials = (finalFirstName?.[0] || '?').toUpperCase();

    // Default classes based on size
    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
        xl: 'w-20 h-20 text-xl'
    };

    return (
        <div
            className={`rounded-full flex items-center justify-center font-bold text-white relative overflow-hidden shrink-0 ${sizeClasses[size]} ${!finalAvatarUrl ? 'bg-gradient-to-br from-primary to-accent border border-white/10' : ''} ${className}`}
        >
            {finalAvatarUrl ? (
                <img
                    src={finalAvatarUrl}
                    alt={`${finalFirstName} ${lastName}`}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
