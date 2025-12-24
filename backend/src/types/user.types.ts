import { User as PrismaUser } from '@prisma/client';

export interface User extends Omit<PrismaUser, 'password'> {
  // Add any additional fields or overrides here
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  timezone?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  timezone?: string;
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  timezone: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRole extends UserResponse {
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}
