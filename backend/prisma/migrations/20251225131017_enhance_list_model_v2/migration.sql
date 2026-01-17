-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "listId" TEXT;

-- AlterTable
ALTER TABLE "List" ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
