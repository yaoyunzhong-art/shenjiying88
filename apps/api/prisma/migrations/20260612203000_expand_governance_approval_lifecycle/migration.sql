-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ApprovalStatus" ADD VALUE 'SUPERSEDED';

-- AlterTable
ALTER TABLE "GovernanceApproval"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
