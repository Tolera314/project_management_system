import { NotificationType } from '@prisma/client';
import { sendEmail, getTaskAssignedEmailTemplate, getPlatformWelcomeTemplate } from '../lib/email';
import prisma from '../lib/prisma';
import { SocketService } from './socket.service';

export interface NotificationPayload {
    type: NotificationType;
    recipientId: string;
    actorId?: string;
    projectId?: string;
    taskId?: string;
    milestoneId?: string;
    title: string;
    message: string;
    metadata?: any;
    link?: string;
}

export class NotificationService {
    static async sendWelcomeEmail(user: { email: string, firstName: string }) {
        try {
            await sendEmail({
                to: user.email,
                subject: 'Welcome to ProjectOS!',
                html: getPlatformWelcomeTemplate(user.firstName)
            });
        } catch (error) {
            console.error('[NotificationService] Failed to send welcome email:', error);
        }
    }

    /**
     * Centralized method to create a notification and send email if preferred.
     */
    static async notify(payload: NotificationPayload) {
        try {
            // 1. Fetch user preferences
            const preference = await prisma.notificationPreference.findUnique({
                where: { userId: payload.recipientId }
            });

            // If no preference found, we'll initialize default (everything true) or just proceed with defaults
            // For now, assume default is TRUE for all if preference object doesn't exist.

            const shouldSendInApp = this.checkInAppPreference(payload.type, preference);
            const shouldSendEmail = this.checkEmailPreference(payload.type, preference);

            // 2. Create In-App Notification if enabled
            if (shouldSendInApp) {
                // Auto-generate link if missing
                let link = payload.link;
                if (!link) {
                    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    if (payload.taskId && payload.projectId) {
                        link = `${baseUrl}/projects/${payload.projectId}?taskId=${payload.taskId}`;
                    } else if (payload.projectId) {
                        link = `${baseUrl}/projects/${payload.projectId}`;
                    }
                }

                const notification = await prisma.notification.create({
                    data: {
                        type: payload.type,
                        userId: payload.recipientId,
                        actorId: payload.actorId,
                        projectId: payload.projectId,
                        taskId: payload.taskId,
                        milestoneId: payload.milestoneId,
                        title: payload.title,
                        message: payload.message,
                        metadata: payload.metadata
                    },
                    include: {
                        actor: { select: { firstName: true, lastName: true, avatarUrl: true } },
                        project: { select: { id: true, name: true } },
                        task: { select: { id: true, title: true } }
                    }
                });

                // Emit real-time event
                SocketService.emitToUser(payload.recipientId, 'notification', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    createdAt: notification.createdAt,
                    isRead: false,
                    actor: notification.actor,
                    project: notification.project,
                    task: notification.task,
                    link: link || payload.link
                });
            }

            // 3. Send Email if enabled
            if (shouldSendEmail) {
                const recipient = await prisma.user.findUnique({
                    where: { id: payload.recipientId }
                });

                if (recipient?.email) {
                    await sendEmail({
                        to: recipient.email,
                        subject: payload.title,
                        html: this.formatEmailHtml(payload)
                    });
                }
            }
        } catch (error) {
            console.error('[NotificationService] Failed to send notification:', error);
        }
    }

    private static checkInAppPreference(type: NotificationType, pref: any): boolean {
        if (!pref) return true; // Default to notify

        switch (type) {
            case 'TASK_ASSIGNED': return pref.taskAssignedInApp;
            case 'TASK_STATUS_CHANGED': return pref.taskStatusInApp;
            case 'TASK_COMMENTED': return pref.taskCommentInApp;
            case 'TASK_DUE_SOON':
            case 'TASK_OVERDUE': return pref.taskDueInApp;
            case 'PROJECT_MEMBER_ADDED': return pref.projectMemberInApp;
            case 'PROJECT_ROLE_CHANGED': return pref.projectRoleInApp;
            case 'MILESTONE_COMPLETED':
            case 'MILESTONE_AT_RISK': return pref.milestoneInApp;
            case 'INVITATION_ACCEPTED': return pref.invitationInApp;
            case 'MENTIONED': return true; // Always notify in-app
            default: return true;
        }
    }

    private static checkEmailPreference(type: NotificationType, pref: any): boolean {
        if (!pref) return true; // Default to notify

        // Critical alerts that cannot be disabled
        if (type === 'SECURITY_ALERT') return true;

        switch (type) {
            case 'TASK_ASSIGNED': return pref.taskAssignedEmail;
            case 'TASK_STATUS_CHANGED': return pref.taskStatusEmail;
            case 'TASK_COMMENTED': return pref.taskCommentEmail;
            case 'TASK_DUE_SOON':
            case 'TASK_OVERDUE': return pref.taskDueEmail;
            case 'PROJECT_MEMBER_ADDED': return pref.projectMemberEmail;
            case 'PROJECT_ROLE_CHANGED': return pref.projectRoleEmail;
            case 'MILESTONE_COMPLETED':
            case 'MILESTONE_AT_RISK': return pref.milestoneEmail;
            case 'INVITATION_ACCEPTED': return pref.invitationEmail;
            case 'MENTIONED': return true; // Always notify via email unless globally disabled (which we don't have yet)
            default: return false;
        }
    }

    private static formatEmailHtml(payload: NotificationPayload): string {
        // Fallback or specific template based on type
        if (payload.type === 'TASK_ASSIGNED' && payload.metadata?.taskTitle) {
            return getTaskAssignedEmailTemplate(
                payload.metadata.taskTitle,
                payload.metadata.projectName || 'Project',
                payload.metadata.actorName || 'A team member',
                payload.link || '#'
            );
        }

        if (payload.type === 'MENTIONED') {
            return `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                    <h2 style="color: #4F46E5;">You were mentioned</h2>
                    <p>${payload.message}</p>
                    <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; font-style: italic; color: #475569;">
                        "${payload.metadata?.commentContent || ''}"
                    </div>
                    ${payload.link ? `<a href="${payload.link}" style="display:inline-block; padding:12px 24px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">View Context</a>` : ''}
                </div>
            `;
        }

        // Generic template for others
        return `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>${payload.title}</h2>
                <p>${payload.message}</p>
                ${payload.link ? `<a href="${payload.link}" style="display:inline-block; padding:10px 20px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:5px;">View Details</a>` : ''}
            </div>
        `;
    }
}
