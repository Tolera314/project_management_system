/*
  Warnings:

  - Added the required column `createdById` to the `Milestone` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
