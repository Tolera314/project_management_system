-- CreateEnum
CREATE TYPE "TemplateVisibility" AS ENUM ('SYSTEM', 'WORKSPACE', 'PRIVATE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "templateVisibility" "TemplateVisibility" DEFAULT 'WORKSPACE';
