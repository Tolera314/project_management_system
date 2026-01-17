-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SYSTEM_ADMIN', 'SUPPORT', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'USER';
