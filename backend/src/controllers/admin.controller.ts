
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SystemRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../lib/email';

// Helper function to create audit log
const createAuditLog = async (
    performedById: string,
    action: string,
    entityType: string,
    targetUserId?: string,
    entityId?: string,
    metadata?: any,
    req?: Request
) => {
    await prisma.adminAuditLog.create({
        data: {
            action,
            entityType,
            targetUserId,
            performedById,
            entityId,
            metadata,
            ipAddress: req?.ip || req?.headers['x-forwarded-for'] as string,
            userAgent: req?.headers['user-agent']
        }
    });
};

export const getOverviewStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.systemRole !== SystemRole.SYSTEM_ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Parallel stats fetching
        const [
            totalUsers,
            totalWorkspaces,
            totalProjects,
            activeUsersLast7Days
        ] = await Promise.all([
            prisma.user.count(),
            prisma.organization.count(),
            prisma.project.count(),
            prisma.user.count({
                // Placeholder for "Active" - ideally based on last login session
                where: { status: 'ACTIVE' }
            }),
            // Add more stats as needed
        ]);

        const stats = {
            users: { total: totalUsers, active: activeUsersLast7Days, growth: 12 }, // Growth is mock for now or calc simple
            workspaces: { total: totalWorkspaces, growth: 5 },
            projects: { total: totalProjects, active: totalProjects }, // Approximation
            revenue: { total: 0, growth: 0 } // No billing yet
        };

        res.json(stats);
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWorkspaces = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.systemRole !== SystemRole.SYSTEM_ADMIN) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const { q, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (q) {
            where.name = { contains: String(q), mode: 'insensitive' };
        }

        const workspaces = await prisma.organization.findMany({
            where,
            include: {
                members: {
                    where: { role: { name: 'OWNER' } }, // Assuming 'OWNER' role name exists. If not, we take first member or creator.
                    take: 1,
                    include: { user: true }
                },
                _count: {
                    select: {
                        members: true,
                        projects: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.organization.count({ where });

        // Map to UI friendly format
        const formattedWorkspaces = workspaces.map(w => {
            const ownerMember = w.members[0];
            const ownerName = ownerMember?.user ? `${ownerMember.user.firstName} ${ownerMember.user.lastName}` : 'Unknown';

            return {
                id: w.id,
                name: w.name,
                owner: ownerName,
                plan: 'PRO', // Mock
                members: w._count.members,
                projects: w._count.projects,
                createdAt: w.createdAt,
                status: 'ACTIVE'
            };
        });

        res.json({
            workspaces: formattedWorkspaces,
            metadata: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error('Get admin workspaces error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ========== USER MANAGEMENT ENDPOINTS ==========

// Get all users with pagination, search, and filters
export const getUsers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { q, page = 1, limit = 10, role, status, mfaEnabled, minWorkspaces } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        
        // Search by name, email, or ID
        if (q) {
            where.OR = [
                { firstName: { contains: String(q), mode: 'insensitive' } },
                { lastName: { contains: String(q), mode: 'insensitive' } },
                { email: { contains: String(q), mode: 'insensitive' } },
                { id: { contains: String(q) } }
            ];
        }

        // Filter by role
        if (role && role !== 'ALL') {
            where.systemRole = role;
        }

        // Filter by status
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Filter by MFA
        if (mfaEnabled !== undefined && mfaEnabled !== '') {
            where.mfaEnabled = mfaEnabled === 'true';
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    systemRole: true,
                    status: true,
                    mfaEnabled: true,
                    lastLogin: true,
                    createdAt: true,
                    _count: {
                        select: {
                            organizationMembers: true
                        }
                    }
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        // Filter by min workspaces if provided
        let filteredUsers = users;
        if (minWorkspaces) {
            filteredUsers = users.filter(u => u._count.organizationMembers >= Number(minWorkspaces));
        }

        const formattedUsers = filteredUsers.map(user => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            avatarUrl: user.avatarUrl,
            systemRole: user.systemRole,
            status: user.status,
            mfaEnabled: user.mfaEnabled,
            workspaceCount: user._count.organizationMembers,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        }));

        res.json({
            users: formattedUsers,
            metadata: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single user detail with workspace memberships
export const getUserDetail = async (req: Request, res: Response) => {
    try {
        const { userId: targetUserId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                systemRole: true,
                status: true,
                mfaEnabled: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                organizationMembers: {
                    include: {
                        organization: true,
                        role: true
                    }
                },
                sessions: {
                    where: {
                        expiresAt: { gt: new Date() }
                    },
                    select: {
                        id: true,
                        userAgent: true,
                        ipAddress: true,
                        lastActive: true,
                        createdAt: true
                    },
                    orderBy: { lastActive: 'desc' }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const workspaces = user.organizationMembers.map(om => ({
            organizationId: om.organization.id,
            organizationName: om.organization.name,
            role: om.role.name,
            joinedAt: om.createdAt
        }));

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            systemRole: user.systemRole,
            status: user.status,
            mfaEnabled: user.mfaEnabled,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            workspaces,
            activeSessions: user.sessions
        });
    } catch (error) {
        console.error('Get user detail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user global role
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId } = req.params;
        const { systemRole } = req.body;

        // Validation
        if (!Object.values(SystemRole).includes(systemRole)) {
            res.status(400).json({ error: 'Invalid system role' });
            return;
        }

        // Cannot change own role
        if (adminId === targetUserId) {
            res.status(400).json({ error: 'Cannot change your own role' });
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { systemRole: true }
        });

        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // If removing the last SYSTEM_ADMIN, prevent it
        if (targetUser.systemRole === SystemRole.SYSTEM_ADMIN && systemRole !== SystemRole.SYSTEM_ADMIN) {
            const adminCount = await prisma.user.count({
                where: { systemRole: SystemRole.SYSTEM_ADMIN, status: 'ACTIVE' }
            });
            if (adminCount <= 1) {
                res.status(400).json({ error: 'Cannot remove the last system admin' });
                return;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { systemRole }
        });

        await createAuditLog(
            adminId,
            'USER_ROLE_CHANGED',
            'USER',
            targetUserId,
            targetUserId,
            { oldRole: targetUser.systemRole, newRole: systemRole },
            req
        );

        res.json({ message: 'User role updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Suspend or activate user account
export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId } = req.params;
        const { status } = req.body;

        const validStatuses = ['ACTIVE', 'SUSPENDED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        // Cannot change own status
        if (adminId === targetUserId) {
            res.status(400).json({ error: 'Cannot change your own status' });
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { status: true, systemRole: true }
        });

        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // If suspending the last active SYSTEM_ADMIN, prevent it
        if (targetUser.systemRole === SystemRole.SYSTEM_ADMIN && status === 'SUSPENDED') {
            const activeAdminCount = await prisma.user.count({
                where: { 
                    systemRole: SystemRole.SYSTEM_ADMIN, 
                    status: 'ACTIVE',
                    id: { not: targetUserId }
                }
            });
            if (activeAdminCount === 0) {
                res.status(400).json({ error: 'Cannot suspend the last active system admin' });
                return;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { status }
        });

        // If suspending, force logout all sessions
        if (status === 'SUSPENDED') {
            await prisma.session.deleteMany({
                where: { userId: targetUserId }
            });
        }

        await createAuditLog(
            adminId,
            status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
            'USER',
            targetUserId,
            targetUserId,
            { oldStatus: targetUser.status, newStatus: status },
            req
        );

        res.json({ message: `User ${status.toLowerCase()} successfully`, user: updatedUser });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Force logout all user sessions
export const forceLogoutUser = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId } = req.params;

        // Cannot force logout self
        if (adminId === targetUserId) {
            res.status(400).json({ error: 'Cannot force logout yourself' });
            return;
        }

        const deletedSessions = await prisma.session.deleteMany({
            where: { userId: targetUserId }
        });

        await createAuditLog(
            adminId,
            'USER_FORCE_LOGOUT',
            'USER',
            targetUserId,
            targetUserId,
            { sessionsRevoked: deletedSessions.count },
            req
        );

        res.json({ message: 'All sessions revoked successfully', sessionsRevoked: deletedSessions.count });
    } catch (error) {
        console.error('Force logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Reset user password (send email)
export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { email: true, firstName: true, lastName: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await prisma.user.update({
            where: { id: targetUserId },
            data: { 
                password: hashedPassword,
                passwordVersion: { increment: 1 }
            }
        });

        // Send email with temp password
        await sendEmail({
            to: user.email,
            subject: 'Password Reset by Administrator',
            html: `<p>Your password has been reset by a system administrator.</p><p><strong>Temporary Password:</strong> ${tempPassword}</p><p>Please log in and change your password immediately.</p>`
        });

        await createAuditLog(
            adminId,
            'USER_PASSWORD_RESET',
            'USER',
            targetUserId,
            targetUserId,
            null,
            req
        );

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Toggle MFA for user
export const toggleUserMFA = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId } = req.params;
        const { mfaEnabled } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { mfaEnabled }
        });

        await createAuditLog(
            adminId,
            mfaEnabled ? 'USER_MFA_ENABLED' : 'USER_MFA_DISABLED',
            'USER',
            targetUserId,
            targetUserId,
            null,
            req
        );

        res.json({ message: `MFA ${mfaEnabled ? 'enabled' : 'disabled'} successfully`, user: updatedUser });
    } catch (error) {
        console.error('Toggle MFA error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove user from workspace
export const removeUserFromWorkspace = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId, organizationId } = req.params;

        const orgMember = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: targetUserId
                }
            }
        });

        if (!orgMember) {
            res.status(404).json({ error: 'User is not a member of this workspace' });
            return;
        }

        await prisma.organizationMember.delete({
            where: { id: orgMember.id }
        });

        await createAuditLog(
            adminId,
            'USER_REMOVED_FROM_WORKSPACE',
            'WORKSPACE',
            targetUserId,
            organizationId,
            null,
            req
        );

        res.json({ message: 'User removed from workspace successfully' });
    } catch (error) {
        console.error('Remove user from workspace error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user audit history
export const getUserAuditHistory = async (req: Request, res: Response) => {
    try {
        const { userId: targetUserId } = req.params;
        const { page = 1, limit = 20, actionType } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { targetUserId };
        if (actionType && actionType !== 'ALL') {
            where.action = actionType;
        }

        const [logs, total] = await Promise.all([
            prisma.adminAuditLog.findMany({
                where,
                include: {
                    performedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.adminAuditLog.count({ where })
        ]);

        res.json({
            logs,
            metadata: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get audit history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user (hard delete with confirmation)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).userId;
        const { userId: targetUserId } = req.params;

        // Cannot delete self
        if (adminId === targetUserId) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { systemRole: true }
        });

        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // If deleting the last SYSTEM_ADMIN, prevent it
        if (targetUser.systemRole === SystemRole.SYSTEM_ADMIN) {
            const adminCount = await prisma.user.count({
                where: { 
                    systemRole: SystemRole.SYSTEM_ADMIN,
                    id: { not: targetUserId }
                }
            });
            if (adminCount === 0) {
                res.status(400).json({ error: 'Cannot delete the last system admin' });
                return;
            }
        }

        await createAuditLog(
            adminId,
            'USER_DELETED',
            'USER',
            targetUserId,
            targetUserId,
            null,
            req
        );

        await prisma.user.delete({
            where: { id: targetUserId }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
