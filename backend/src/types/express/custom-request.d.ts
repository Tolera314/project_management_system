import { Request } from 'express';
import { AuthUser } from '../auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface CreateOrganizationRequest extends Request {
  body: {
    name: string;
    slug: string;
    color?: string;
    logoUrl?: string;
  };
  user: {
    id: string;
  };
}

export interface GetOrganizationRequest extends Request {
  params: {
    id: string;
  };
}

export interface UpdateOrganizationRequest extends Request {
  params: {
    id: string;
  };
  body: {
    name?: string;
    slug?: string;
    color?: string;
    logoUrl?: string;
    settings?: any;
  };
}

export interface DeleteOrganizationRequest extends Request {
  params: {
    id: string;
  };
}

export interface GetOrganizationMembersRequest extends Request {
  params: {
    id: string;
  };
}

export interface AddOrganizationMemberRequest extends Request {
  params: {
    id: string;
  };
  body: {
    email: string;
    roleId: string;
  };
}

export interface RemoveOrganizationMemberRequest extends Request {
  params: {
    id: string;
    memberId: string;
  };
}

export interface UpdateMemberRoleRequest extends Request {
  params: {
    id: string;
    memberId: string;
  };
  body: {
    roleId: string;
  };
}
