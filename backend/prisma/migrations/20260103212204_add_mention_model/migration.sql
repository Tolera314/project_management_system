/*
  Warnings:

  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'TASK_COMMENTED', 'MENTIONED', 'PROJECT_MEMBER_ADDED', 'PROJECT_ROLE_CHANGED', 'MILESTONE_COMPLETED', 'MILESTONE_AT_RISK', 'INVITATION_ACCEPTED', 'PERMISSION_CHANGED', 'SECURITY_ALERT');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "milestoneId" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskAssignedInApp" BOOLEAN NOT NULL DEFAULT true,
    "taskAssignedEmail" BOOLEAN NOT NULL DEFAULT true,
    "taskStatusInApp" BOOLEAN NOT NULL DEFAULT true,
    "taskStatusEmail" BOOLEAN NOT NULL DEFAULT false,
    "taskCommentInApp" BOOLEAN NOT NULL DEFAULT true,
    "taskCommentEmail" BOOLEAN NOT NULL DEFAULT true,
    "taskDueInApp" BOOLEAN NOT NULL DEFAULT true,
    "taskDueEmail" BOOLEAN NOT NULL DEFAULT true,
    "projectMemberInApp" BOOLEAN NOT NULL DEFAULT true,
    "projectMemberEmail" BOOLEAN NOT NULL DEFAULT true,
    "projectRoleInApp" BOOLEAN NOT NULL DEFAULT true,
    "projectRoleEmail" BOOLEAN NOT NULL DEFAULT false,
    "milestoneInApp" BOOLEAN NOT NULL DEFAULT true,
    "milestoneEmail" BOOLEAN NOT NULL DEFAULT false,
    "invitationInApp" BOOLEAN NOT NULL DEFAULT true,
    "invitationEmail" BOOLEAN NOT NULL DEFAULT true,
    "securityEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
