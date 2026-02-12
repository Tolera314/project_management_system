-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
