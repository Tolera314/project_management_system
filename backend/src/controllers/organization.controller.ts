import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import {
  CreateOrganizationRequest,
  GetOrganizationRequest,
  UpdateOrganizationRequest,
  DeleteOrganizationRequest,
  GetOrganizationMembersRequest,
  AddOrganizationMemberRequest,
  RemoveOrganizationMemberRequest,
  UpdateMemberRoleRequest
} from '../types/express/custom-request';

// Custom error handling middleware
const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma errors
    switch (error.code) {
      case 'P2002':
        return res.status(400).json({
          error: 'A unique constraint was violated',
          details: error.meta,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'The requested resource was not found',
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          code: error.code,
          meta: error.meta,
        });
    }
  }

  // Handle other types of errors
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// Error handling middleware remains the same

export const createOrganization = async (req: CreateOrganizationRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, color, logoUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        color,
        logoUrl,
        members: {
          create: {
            userId,
            role: {
              connect: {
                name: 'OWNER',
              },
            },
          },
        },
      },
      include: {
        members: true,
      },
    });

    return res.status(201).json(organization);
  } catch (error) {
    next(error);
  }
};


export const getOrganization = async (req: GetOrganizationRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            role: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};


export const updateOrganization = async (req: UpdateOrganizationRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, color, logoUrl, settings } = req.body;

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        slug,
        color,
        logoUrl,
        settings,
      },
    });

    res.json(organization);
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};


export const deleteOrganization = async (req: DeleteOrganizationRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.organization.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};


export const getOrganizationMembers = async (req: GetOrganizationMembersRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        role: true,
      },
    });

    return res.json(members);
  } catch (error) {
    next(error);
  }
};


export const addOrganizationMember = async (req: AddOrganizationMemberRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, roleId } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: id,
        userId: user.id,
      },
    });

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this organization' });
    }

    // Add user to organization
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: id,
        userId: user.id,
        roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        role: true,
      },
    });

    return res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};


export const removeOrganizationMember = async (req: RemoveOrganizationMemberRequest, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;

    await prisma.organizationMember.delete({
      where: {
        id: memberId,
        organizationId: id,
      },
    });

    res.status(204).send();
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};


export const updateMemberRole = async (req: UpdateMemberRoleRequest, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;
    const { roleId } = req.body;

    const member = await prisma.organizationMember.update({
      where: {
        id: memberId,
        organizationId: id,
      },
      data: {
        roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        role: true,
      },
    });

    return res.json(member);
  } catch (error) {
    next(error);
  }
};
