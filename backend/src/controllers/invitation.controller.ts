import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { NotificationService } from '../services/notification.service';

/**
 * Verify an invitation token
 * GET /invitations/verify/:token
 */
export const verifyInvitation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        // Find invitation by token
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                role: true,
                invitedBy: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });

        if (!invitation) {
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }

        // Check if expired
        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });
            res.status(400).json({ error: 'Invitation has expired' });
            return;
        }

        // Check if already accepted
        if (invitation.status === 'ACCEPTED') {
            res.status(400).json({ error: 'Invitation has already been accepted' });
            return;
        }

        // Check if revoked
        if (invitation.status === 'REVOKED') {
            res.status(400).json({ error: 'Invitation has been revoked' });
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email.toLowerCase() }
        });

        // Get resource name
        let resourceName = '';
        if (invitation.type === 'WORKSPACE' && invitation.organizationId) {
            const org = await prisma.organization.findUnique({
                where: { id: invitation.organizationId },
                select: { name: true }
            });
            resourceName = org?.name || 'Unknown Workspace';
        } else if (invitation.type === 'PROJECT' && invitation.projectId) {
            const project = await prisma.project.findUnique({
                where: { id: invitation.projectId },
                select: { name: true }
            });
            resourceName = project?.name || 'Unknown Project';
        }

        res.json({
            valid: true,
            email: invitation.email,
            type: invitation.type,
            resourceName,
            roleName: invitation.role.name,
            inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
            requiresSignup: !existingUser,
            expiresAt: invitation.expiresAt
        });

    } catch (error) {
        console.error('Verify invitation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Accept an invitation (requires authentication)
 * POST /invitations/accept/:token
 */
export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Get authenticated user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Find invitation
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { role: true }
        });

        if (!invitation) {
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }

        // Verify email match (case-insensitive)
        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
            res.status(403).json({
                error: 'This invitation was sent to a different email address',
                invitedEmail: invitation.email
            });
            return;
        }

        // Check if expired
        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });
            res.status(400).json({ error: 'Invitation has expired' });
            return;
        }

        // Check status
        if (invitation.status === 'ACCEPTED') {
            res.status(400).json({ error: 'Invitation has already been accepted' });
            return;
        }

        if (invitation.status === 'REVOKED') {
            res.status(400).json({ error: 'Invitation has been revoked' });
            return;
        }

        // Accept invitation based on type
        let redirectUrl = '/dashboard';

        if (invitation.type === 'WORKSPACE' && invitation.organizationId) {
            // Check if already a member
            const existing = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: invitation.organizationId,
                        userId
                    }
                }
            });

            if (existing) {
                res.status(400).json({ error: 'You are already a member of this workspace' });
                return;
            }

            // Add to workspace
            await prisma.organizationMember.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId,
                    roleId: invitation.roleId
                }
            });

            redirectUrl = '/dashboard';

        } else if (invitation.type === 'PROJECT' && invitation.projectId) {
            const project = await prisma.project.findUnique({
                where: { id: invitation.projectId },
                select: { organizationId: true }
            });

            if (!project) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }

            // Ensure user is in the organization first
            let orgMember = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: project.organizationId,
                        userId
                    }
                }
            });

            // If not in organization, add them as Member
            if (!orgMember) {
                const memberRole = await prisma.role.findFirst({
                    where: {
                        organizationId: project.organizationId,
                        name: 'Member'
                    }
                });

                if (!memberRole) {
                    res.status(500).json({ error: 'Member role not found in organization' });
                    return;
                }

                orgMember = await prisma.organizationMember.create({
                    data: {
                        organizationId: project.organizationId,
                        userId,
                        roleId: memberRole.id
                    }
                });
            }

            // Check if already a project member
            const existingPM = await prisma.projectMember.findUnique({
                where: {
                    projectId_organizationMemberId: {
                        projectId: invitation.projectId,
                        organizationMemberId: orgMember.id
                    }
                }
            });

            if (existingPM) {
                res.status(400).json({ error: 'You are already a member of this project' });
                return;
            }

            // Add to project
            await prisma.projectMember.create({
                data: {
                    projectId: invitation.projectId,
                    organizationMemberId: orgMember.id,
                    roleId: invitation.roleId
                }
            });

            redirectUrl = `/projects/${invitation.projectId}`;
        }

        // Update invitation status
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date(),
            }
        });

        // Send Notification to Inviter
        try {
            const invitee = await prisma.user.findUnique({ where: { id: userId } });
            await NotificationService.notify({
                type: 'INVITATION_ACCEPTED',
                recipientId: invitation.invitedById,
                actorId: userId,
                title: 'Invitation Accepted',
                message: `${invitee ? `${invitee.firstName} ${invitee.lastName}` : 'Someone'} accepted your invitation.`,
                link: invitation.type === 'PROJECT' ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${invitation.projectId}` : '/dashboard',
                metadata: {
                    inviteeName: invitee ? `${invitee.firstName} ${invitee.lastName}` : 'Someone',
                    type: invitation.type
                }
            });
        } catch (notifErr) {
            console.error('Failed to send invitation accepted notification:', notifErr);
        }

        res.json({ message: 'Invitation accepted successfully', redirectUrl });

    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Generate invitation token helper
 */
export const generateInvitationToken = (invitationId: string): string => {
    return jwt.sign(
        { invitationId },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );
};
