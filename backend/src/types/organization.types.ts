import { Organization as PrismaOrganization } from '@prisma/client';

export interface Organization extends PrismaOrganization {}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  color?: string;
  logoUrl?: string;
  settings?: Record<string, any>;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  color?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, any> | null;
}

export interface OrganizationWithMembers extends Organization {
  members: {
    id: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    role: {
      id: string;
      name: string;
    };
    joinedAt: Date;
  }[];
}

export interface AddMemberInput {
  email: string;
  roleId: string;
}

export interface UpdateMemberRoleInput {
  roleId: string;
}

export interface OrganizationStats {
  totalProjects: number;
  activeProjects: number;
  totalMembers: number;
  upcomingDeadlines: number;
}
