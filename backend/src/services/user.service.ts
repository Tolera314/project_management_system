import { prisma } from '../lib/prisma';
import { User, Organization, OrganizationMember } from '@prisma/client';
import { hash } from 'bcrypt';

export interface UserWithOrganizations extends User {
  organizations: {
    id: string;
    name: string;
    role: string;
  }[];
}

export class UserService {
  static async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName?: string
  ): Promise<{ user: User; organization?: Organization; member?: OrganizationMember }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    return await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      // If organization name is provided, create organization and add user as admin
      if (organizationName) {
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
          },
        });

        // Create default admin role
        const adminRole = await tx.role.create({
          data: {
            name: 'Admin',
            description: 'Organization administrator with full access',
            isSystem: true,
            organizationId: organization.id,
            createdById: user.id,
          },
        });

        // Add user to organization as admin
        const member = await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            roleId: adminRole.id,
          },
        });

        return { user, organization, member };
      }

      return { user };
    });
  }

  static async getUserById(id: string): Promise<UserWithOrganizations | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Transform the data to match the return type
    const { organizationMembers, ...userData } = user as any;
    const organizations = organizationMembers.map((member: any) => ({
      id: member.organization.id,
      name: member.organization.name,
      role: member.role.name,
    }));

    return { ...userData, organizations };
  }

  static async updateUser(
    id: string,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl' | 'timezone'>>
  ): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string): Promise<void> {
    // Soft delete the user
    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  static async getUserOrganizations(userId: string) {
    return await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
        role: true,
      },
    });
  }
}

export default UserService;
