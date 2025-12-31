import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
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

        // Check if user already has a workspace
        console.log(`[WorkspaceService] Checking membership for user: ${userId}`);
        const existingMembership = await prisma.organizationMember.findFirst({
            where: { userId },
            include: {
                organization: true,
                role: true
            }
        });

        if (existingMembership) {
            console.log(`[WorkspaceService] User ${userId} already has membership in organization: ${existingMembership.organizationId}. Returning existing workspace.`);
            res.status(200).json({
                message: 'You already have a workspace',
                workspace: {
                    id: existingMembership.organization.id,
                    name: existingMembership.organization.name,
                }
            });
            return;
        }

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
            const permMap = new Map(permissions.map(p => [p.name, p.id]));

            const getPermIds = (names: string[]) => names.map(n => permMap.get(n)).filter(id => id !== undefined) as string[];

            // 2. Define Roles & Permissions
            const roleDefinitions = [
                {
                    name: 'Admin',
                    description: 'Workspace Admin with full access',
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
                        'view_project', 'view_reports', 'download_file', 'view_file_versions'
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

                if (def.name === 'Admin') createdAdminRole = role;

                if (def.permissions.length > 0) {
                    const permIds = getPermIds(def.permissions);
                    if (permIds.length > 0) {
                        await tx.rolePermission.createMany({
                            data: permIds.map(permId => ({
                                roleId: role.id,
                                permissionId: permId
                            }))
                        });
                    }
                }
            }

            if (!createdAdminRole) throw new Error('Failed to create Admin role');
            const adminRole = createdAdminRole; // For scope guarantees

            await tx.organizationMember.create({
                data: {
                    organizationId: organization.id,
                    userId,
                    roleId: adminRole.id
                }
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

export const getUserWorkspace = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log(`[WorkspaceService] Getting workspace for user: ${userId}`);
        const membership = await prisma.organizationMember.findFirst({
            where: { userId },
            include: {
                organization: {
                    include: { roles: true }
                },
                role: true
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

        if (!inviterMember || inviterMember.role.name !== 'Admin') {
            res.status(403).json({ error: 'Only admins can invite members' });
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
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

        if (!requester || requester.role.name !== 'Admin') {
            res.status(403).json({ error: 'Only admins can remove members' });
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

        // Safety Rule: Prevent removing the last Admin
        if (memberToRemove.role.name === 'Admin') {
            const adminCount = await prisma.organizationMember.count({
                where: {
                    organizationId: id,
                    role: { name: 'Admin' }
                }
            });

            if (adminCount <= 1) {
                res.status(400).json({ error: 'Cannot remove the last Admin from the workspace' });
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
