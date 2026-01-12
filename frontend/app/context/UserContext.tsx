'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    systemRole: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    updateUser: (data: Partial<User>) => void;
    refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);

    const loadUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setUserState(JSON.parse(userStr));
            } catch (e) {
                console.error('Failed to parse user from localStorage', e);
            }
        }
    };

    useEffect(() => {
        loadUser();

        // Listen for storage events (tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user') {
                loadUser();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const setUser = (user: User | null) => {
        setUserState(user);
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    };

    const updateUser = (data: Partial<User>) => {
        setUserState(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...data };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, refreshUser: loadUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
