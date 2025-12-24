'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

// Helper function to parse JWT tokens
const parseJwt = (token: string) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (e) {
    return null;
  }
};

interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  timezone: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    organizationName?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Check if token is expired
          const decodedToken = parseJwt(token);
          if (!decodedToken) {
            throw new Error('Invalid token');
          }
          const isExpired = decodedToken.exp * 1000 < Date.now();
          
          if (isExpired) {
            // Try to refresh the token if it's expired
            await refreshToken();
          } else {
            // Set up token refresh before it expires (5 minutes before expiration)
            const expiresIn = (decodedToken.exp * 1000) - Date.now() - (5 * 60 * 1000);
            
            // Clear any existing refresh timeout
            const existingTimeout = localStorage.getItem('refreshTimeout');
            if (existingTimeout) {
              clearTimeout(parseInt(existingTimeout, 10));
            }
            
            // Set new refresh timeout
            const timeoutId = window.setTimeout(() => {
              refreshToken();
            }, Math.max(0, expiresIn));
            
            localStorage.setItem('refreshTimeout', timeoutId.toString());
          }
          
          // Get fresh user data
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Clean up timeouts on unmount
    return () => {
      const refreshTimeout = localStorage.getItem('refreshTimeout');
      if (refreshTimeout) {
        clearTimeout(parseInt(refreshTimeout, 10));
      }
    };
  }, []);

  // Handle protected routes
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && isPublicPath) {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ 
        message: string;
        token: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { email, password });
      
      const { token, refreshToken, user } = response;
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set up token refresh before it expires (5 minutes before expiration)
      const decodedToken = parseJwt(token);
      if (!decodedToken) {
        throw new Error('Invalid token');
      }
      const expiresIn = (decodedToken.exp * 1000) - Date.now() - (5 * 60 * 1000);
      
      // Clear any existing refresh timeout
      const existingTimeout = localStorage.getItem('refreshTimeout');
      if (existingTimeout) {
        clearTimeout(parseInt(existingTimeout, 10));
      }
      
      // Set new refresh timeout
      const timeoutId = window.setTimeout(() => {
        refreshToken();
      }, Math.max(0, expiresIn));
      
      localStorage.setItem('refreshTimeout', timeoutId.toString());
      
      setUser(user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    organizationName?: string;
  }) => {
    try {
      // Split fullName into firstName and lastName
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const response = await api.post<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', {
        email: data.email,
        password: data.password,
        firstName,
        lastName
      });
      
      const { user, tokens } = response;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setUser(user);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear any pending refresh timeouts
    const refreshTimeout = localStorage.getItem('refreshTimeout');
    if (refreshTimeout) {
      clearTimeout(parseInt(refreshTimeout, 10));
      localStorage.removeItem('refreshTimeout');
    }
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<{ 
        token: string; 
        refreshToken: string;
        user: User;
      }>('/auth/refresh-token', { refreshToken });
      
      const { token: newAccessToken, refreshToken: newRefreshToken, user } = response;
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Set up next refresh
      const decodedToken = parseJwt(newAccessToken);
      if (!decodedToken) {
        throw new Error('Invalid token');
      }
      const expiresIn = (decodedToken.exp * 1000) - Date.now() - (5 * 60 * 1000);
      
      // Clear any existing refresh timeout
      const existingTimeout = localStorage.getItem('refreshTimeout');
      if (existingTimeout) {
        clearTimeout(parseInt(existingTimeout, 10));
      }
      
      // Set new refresh timeout
      const timeoutId = window.setTimeout(() => {
        refreshToken();
      }, Math.max(0, expiresIn));
      
      localStorage.setItem('refreshTimeout', timeoutId.toString());
      
      setUser(user);
      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/auth/me');
      setUser(response);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, try to refresh it
      if ((error as any)?.response?.status === 401) {
        try {
          await refreshToken();
          // Retry getting user data after token refresh
          const retryResponse = await api.get<User>('/auth/me');
          setUser(retryResponse);
        } catch (refreshError) {
          console.error('Failed to refresh user session:', refreshError);
          setUser(null);
          throw refreshError;
        }
      } else {
        setUser(null);
        throw error;
      }
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
