import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { Prisma, InvitationStatus } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendEmail, getWorkspaceInvitationTemplate } from '../lib/email';

const createWorkspaceSchema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
    type: z.enum(['personal', 'team', 'company']).optional(),
    color: z.string().optional(),
});

export const createWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = createWorkspaceSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const { name, type, color } = validation.data;

        // Multi-workspace support: Removed the check that prevented creating more than one workspace.
        console.log(`[WorkspaceService] Creating new workspace for user: ${userId}`);

        // Create workspace with admin role
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const organization = await tx.organization.create({
                data: {
                    name,
                    color: color || '#4F46E5', // Default color if none provided
                }
            });

            // 1. Fetch Global Permissions
            const permissions = await tx.permission.findMany();
            const permMap = new Map(permissions.map((p: any) => [p.name, p.id]));

            const getPermIds = (names: string[]) => names.map(n => permMap.get(n)).filter(id => id !== undefined) as string[];

            // 2. Define Roles & Permissions
            const roleDefinitions = [
                {
                    name: 'Workspace Manager',
                    description: 'Workspace Manager with full access',
                    isSystem: true,
                    permissions: [] // Implicit superuser
                },
                {
                    name: 'Member',
                    description: 'Standard workspace member',
                    isSystem: false,
                    permissions: ['view_project'] // Can be added to projects
                },
                {
                    name: 'Viewer',
                    description: 'Read-only workspace access',
                    isSystem: false,
                    permissions: []
                },
                {
                    name: 'Project Manager',
                    description: 'Full project management access',
                    isSystem: false,
                    permissions: [
                        'view_project', 'edit_project', 'delete_project', 'manage_project_members', 'manage_project_settings',
                        'create_task', 'edit_task', 'delete_task', 'assign_task', 'change_status', 'comment_task', 'upload_task_file', 'log_time',
                        'manage_lists', 'manage_milestones', 'manage_dependencies', 'edit_timeline',
                        'upload_file', 'download_file', 'delete_file', 'view_file_versions',
                        'view_reports', 'export_reports'
                    ]
                },
                {
                    name: 'Project Member',
                    description: 'Can contribute to projects',
                    isSystem: false,
                    permissions: [
                        'view_project',
                        'create_task', 'edit_task', 'assign_task', 'change_status', 'comment_task', 'upload_task_file', 'log_time',
                        'upload_file', 'download_file', 'view_file_versions'
                    ]
                },
                {
                    name: 'Project Viewer',
                    description: 'Read-only project access',
                    isSystem: false,
                    permissions: [
                        'view_project', 'view_reports', 'download_file', 'view_file_versions', 'comment_task'
                    ]
                }
            ];

            // 3. Create Roles and Assign Permissions
            let createdAdminRole;

            for (const def of roleDefinitions) {
                const role = await tx.role.create({
                    data: {
                        name: def.name,
                        description: def.description,
                        isSystem: def.isSystem,
                        organizationId: organization.id,
                        createdById: userId
                    }
                });

                if (def.name === 'Workspace Manager') createdAdminRole = role;

                if (def.permissions.length > 0) {
                    const permIds = getPermIds(def.permissions);
                    if (permIds.length > 0) {
                        await tx.rolePermission.createMany({
                            data: permIds.map((permId: string) => ({
                                roleId: role.id,
                                permissionId: permId
                            }))
                        });
                    }
                }
            }

            if (!createdAdminRole) throw new Error('Failed to create Workspace Manager role');
            const adminRole = createdAdminRole; // For scope guarantees

            await tx.organizationMember.create({
                data: {
                    organizationId: organization.id,
                    userId,
                    roleId: adminRole.id
                }
            });

            // 4. Seed Default Tags
            const defaultTags = [
                { name: 'Bug', color: '#EF4444' },         // Red
                { name: 'Feature', color: '#3B82F6' },     // Blue
                { name: 'Urgent', color: '#DC2626' },      // Dark Red
                { name: 'Blocked', color: '#F59E0B' },     // Amber
                { name: 'Improvement', color: '#10B981' }  // Emerald
            ];

            await tx.tag.createMany({
                data: defaultTags.map(tag => ({
                    name: tag.name,
                    color: tag.color,
                    organizationId: organization.id
                }))
            });

            return { organization, adminRole };
        }, { timeout: 15000 });

        res.status(201).json({
            message: 'Workspace created successfully',
            workspace: {
                id: result.organization.id,
                name: result.organization.name,
                color: result.organization.color,
            }
        });

    } catch (error) {
        console.error('Create workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all workspaces for the current user
 */
export const getUserWorkspaces = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const memberships = await prisma.organizationMember.findMany({
            where: { userId },
            include: {
                organization: true,
                role: true
            }
        });

        const workspaces = memberships.map((m: any) => ({
            id: m.organization.id,
            name: m.organization.name,
            role: m.role.name,
            color: m.organization.color || '#4F46E5',
            createdAt: m.organization.createdAt
        }));

        res.status(200).json({ workspaces });
    } catch (error) {
        console.error('Get workspaces list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log(`[WorkspaceService] Getting workspace for user: ${userId}`);
        const { workspaceId } = req.query;

        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId,
                ...(workspaceId ? { organizationId: workspaceId as string } : {})
            },
            include: {
                organization: {
                    include: { roles: true }
                },
                role: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        if (!membership) {
            console.log(`[WorkspaceService] No workspace found for user: ${userId}`);
            res.status(200).json({ hasWorkspace: false });
            return;
        }

        console.log(`[WorkspaceService] Workspace found for user: ${userId} - Org: ${membership.organization.name}`);

        res.status(200).json({
            hasWorkspace: true,
            workspace: {
                id: membership.organization.id,
                name: membership.organization.name,
                color: membership.organization.color,
                role: membership.role.name,
                roles: membership.organization.roles
            }
        });

        // ... existing code ...
    } catch (error) {
        console.error('Get workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const membership = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId },
            include: {
                organization: true,
                role: true
            }
        });

        if (!membership) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json(membership.organization);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const validation = createWorkspaceSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const member = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId, role: { name: 'Workspace Manager' } }
        });

        if (!member) {
            res.status(403).json({ error: 'Only managers can update workspace settings' });
            return;
        }

        const updated = await prisma.organization.update({
            where: { id },
            data: validation.data
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const member = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId, role: { name: 'Workspace Manager' } }
        });

        if (!member) {
            res.status(403).json({ error: 'Only managers can delete workspaces' });
            return;
        }

        await prisma.organization.delete({ where: { id } });
        res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const joinWorkspace = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const userId = (req as any).userId;

        const invitation = await prisma.invitation.findUnique({
            where: { token }
        });

        if (!invitation || invitation.status !== InvitationStatus.PENDING || invitation.expiresAt < new Date()) {
            res.status(400).json({ error: 'Invalid or expired invitation' });
            return;
        }

        if (invitation.type !== 'WORKSPACE' || !invitation.organizationId) {
            res.status(400).json({ error: 'Invalid invitation type' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.organizationMember.create({
                data: {
                    organizationId: invitation.organizationId!,
                    userId,
                    roleId: invitation.roleId
                }
            });

            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() }
            });
        });

        res.json({ message: 'Joined workspace successfully' });
    } catch (error) {
        console.error('Join workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const inviteToWorkspace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Workspace ID
        const { email, roleId } = req.body;
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const inviter = await prisma.user.findUnique({ where: { id: userId } });
        if (!inviter) {
            res.status(404).json({ error: 'Inviter not found' });
            return;
        }

        // 1. Verify inviter is Admin
        const inviterMember = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId },
            include: { role: true }
        });

        if (!inviterMember || inviterMember.role.name !== 'Workspace Manager') {
            res.status(403).json({ error: 'Only managers can invite members' });
            return;
        }

        // 2. Fetch workspace and role info
        const [organization, role] = await Promise.all([
            prisma.organization.findUnique({ where: { id } }),
            prisma.role.findUnique({ where: { id: roleId } })
        ]);

        if (!organization || !role) {
            res.status(404).json({ error: 'Workspace or Role not found' });
            return;
        }

        // 3. Check if user already exists and is already a member
        const userToInvite = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (userToInvite) {
            const existingMember = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: id,
                        userId: userToInvite.id
                    }
                }
            });

            if (existingMember) {
                res.status(400).json({ error: 'User is already a member of this workspace' });
                return;
            }
        }

        // 4. Create or Update Invitation
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const invitation = await prisma.invitation.upsert({
            where: { token }, // This is technically a new token, but using upsert to handle potential email index if we had one (we have email index but not unique on email+type yet)
            create: {
                token,
                email: email.toLowerCase(),
                type: 'WORKSPACE',
                organizationId: id,
                roleId: roleId,
                invitedById: userId,
                expiresAt
            },
            update: {
                token, // Refresh token if needed
                roleId: roleId,
                expiresAt
            }
        });

        // 5. Send Invitation Email
        try {
            const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`;
            const emailHtml = getWorkspaceInvitationTemplate(
                organization.name,
                `${inviter.firstName} ${inviter.lastName}`,
                role.name,
                invitationLink
            );

            await sendEmail({
                to: email,
                subject: `Invitation to join ${organization.name}`,
                html: emailHtml
            });
        } catch (emailError) {
            console.error('Failed to send workspace invitation email:', emailError);
            // We don't throw here so the user gets a success response for the database record
        }

        res.status(200).json({
            message: 'Invitation sent successfully',
            token: token // Sending token back for debugging if needed
        });

    } catch (error) {
        console.error('Invite to workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Remove a member from the workspace
 * Safety Rule: Prevents removing the last Admin
 */
export const removeWorkspaceMember = async (req: Request, res: Response) => {
    try {
        const { id, memberId } = req.params; // id = workspaceId
        const userId = (req as any).userId;

        // Verify the requester is an Admin
        const requester = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId },
            include: { role: true }
        });

        if (!requester || requester.role.name !== 'Workspace Manager') {
            res.status(403).json({ error: 'Only managers can remove members' });
            return;
        }

        // Find the member to be removed
        const memberToRemove = await prisma.organizationMember.findFirst({
            where: { id: memberId, organizationId: id },
            include: {
                role: true,
                user: { select: { id: true, email: true, firstName: true, lastName: true } }
            }
        });

        if (!memberToRemove) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }

        // Safety Rule: Prevent removing the last Manager
        if (memberToRemove.role.name === 'Workspace Manager') {
            const adminCount = await prisma.organizationMember.count({
                where: {
                    organizationId: id,
                    role: { name: 'Workspace Manager' }
                }
            });

            if (adminCount <= 1) {
                res.status(400).json({ error: 'Cannot remove the last Manager from the workspace' });
                return;
            }
        }

        // Remove the member
        await prisma.organizationMember.delete({
            where: { id: memberId }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove workspace member error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all members of a workspace
 */
export const getWorkspaceMembers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify membership
        const membership = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId }
        });

        if (!membership) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const members = await prisma.organizationMember.findMany({
            where: { organizationId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        systemRole: true
                    }
                },
                role: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.status(200).json({ members });
    } catch (error) {
        console.error('Get workspace members error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWorkspaceMemberRole = async (req: Request, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const { roleId } = req.body;
        const userId = (req as any).userId;

        // Verify requester is Admin/Owner of workspace
        const requesterMembership = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId },
            include: { role: true }
        });

        if (!requesterMembership || (requesterMembership.role.name !== 'Workspace Manager' && requesterMembership.role.name !== 'Owner')) {
            res.status(403).json({ error: 'Only Managers can manage workspace roles' });
            return;
        }

        // Verify target member belongs to workspace
        const targetMember = await prisma.organizationMember.findUnique({
            where: { id: memberId },
            include: { role: true }
        });

        if (!targetMember || targetMember.organizationId !== id) {
            res.status(404).json({ error: 'Member not found in this workspace' });
            return;
        }

        // Safety: Prevent removing last Manager
        if (targetMember.role.name === 'Workspace Manager') {
            const adminCount = await prisma.organizationMember.count({
                where: {
                    organizationId: id,
                    role: { name: 'Workspace Manager' }
                }
            });
            if (adminCount <= 1 && roleId !== targetMember.roleId) { // If trying to change role
                res.status(400).json({ error: 'Cannot remove the last Manager from the workspace' });
                return;
            }
        }

        // Safety: Prevent self-demotion (optional, but good practice)
        if (targetMember.userId === userId) {
            res.status(400).json({ error: 'You cannot change your own workspace role' });
            return;
        }

        const newRole = await prisma.role.findUnique({ where: { id: roleId } });
        if (!newRole || newRole.organizationId !== id) {
            res.status(400).json({ error: 'Invalid role specified' });
            return;
        }

        const updatedMember = await prisma.organizationMember.update({
            where: { id: memberId },
            data: { roleId },
            include: { role: true, user: true }
        });

        res.json({ member: updatedMember });

    } catch (error) {
        console.error('Update workspace member role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all roles for a workspace
 */
export const getWorkspaceRoles = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify membership
        const membership = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId }
        });

        if (!membership) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const roles = await prisma.role.findMany({
            where: { organizationId: id },
            include: {
                permissions: {
                    include: { permission: true }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: {
                isSystem: 'desc' // List system roles (like Admin) first
            }
        });

        res.status(200).json({ roles });
    } catch (error) {
        console.error('Get workspace roles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * MIGRATION: Rename "Admin" roles to "Workspace Manager"
 * Should be run once by System Admin
 */
export const migrateRoles = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Only System Admin can trigger this global migration
        if (!user || user.systemRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Find all roles named 'Admin' that are NOT global (have organizationId)
        const result = await prisma.role.updateMany({
            where: {
                name: 'Admin'
            },
            data: {
                name: 'Workspace Manager',
                description: 'Workspace Manager with full access'
            }
        });

        res.json({
            message: 'Migration completed',
            updatedCount: result.count
        });

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWorkspacePermissions = async (req: Request, res: Response) => {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: { category: 'asc' }
        });

        // Group by category for easier UI display
        const grouped = permissions.reduce((acc: any, p: any) => {
            if (!acc[p.category]) acc[p.category] = [];
            acc[p.category].push(p);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        console.error('Get workspace permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWorkspaceRolePermissions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id: workspaceId, roleId } = req.params;
        const { permissionIds } = req.body;

        // Verify user is Workspace Manager or Owner
        const member = await prisma.organizationMember.findFirst({
            where: {
                organizationId: workspaceId,
                userId,
                role: { name: { in: ['Owner', 'Admin', 'Workspace Manager'] } }
            }
        });

        if (!member) {
            res.status(403).json({ error: 'Access denied. Only workspace managers can update permissions.' });
            return;
        }

        const role = await prisma.role.findUnique({
            where: { id: roleId }
        });

        if (!role || role.organizationId !== workspaceId) {
            res.status(404).json({ error: 'Role not found in this workspace' });
            return;
        }

        if (role.isSystem && (role.name === 'Owner' || role.name === 'Admin')) {
            res.status(400).json({ error: 'System base roles cannot be modified for stability.' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            // Remove existing permissions
            await tx.rolePermission.deleteMany({
                where: { roleId }
            });

            // Add new permissions
            if (permissionIds && permissionIds.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissionIds.map((pId: string) => ({
                        roleId,
                        permissionId: pId
                    }))
                });
            }
        });

        res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
        console.error('Update workspace role permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createWorkspaceRole = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, description, permissions } = req.body;

        // Verify Manager
        const member = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId, role: { name: 'Workspace Manager' } }
        });

        if (!member) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const role = await prisma.role.create({
            data: {
                name,
                description,
                organizationId: id,
                createdById: userId,
                permissions: {
                    create: permissions?.map((pId: string) => ({ permissionId: pId })) || []
                }
            }
        });

        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWorkspaceRole = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id, roleId } = req.params;
        const { name, description } = req.body;

        const member = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId, role: { name: 'Workspace Manager' } }
        });

        if (!member) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role || role.organizationId !== id) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }

        if (role.isSystem) {
            res.status(400).json({ error: 'Cannot edit system roles' });
            return;
        }

        const updated = await prisma.role.update({
            where: { id: roleId },
            data: { name, description }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteWorkspaceRole = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id, roleId } = req.params;

        const member = await prisma.organizationMember.findFirst({
            where: { organizationId: id, userId, role: { name: 'Workspace Manager' } }
        });

        if (!member) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role || role.organizationId !== id) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }

        if (role.isSystem) {
            res.status(400).json({ error: 'Cannot delete system roles' });
            return;
        }

        await prisma.role.delete({ where: { id: roleId } });
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
