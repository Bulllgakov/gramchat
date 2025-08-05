/*
  Warnings:

  - You are about to drop the `ShopApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ShopApplication" DROP CONSTRAINT "ShopApplication_inviteCodeId_fkey";

-- DropForeignKey
ALTER TABLE "ShopApplication" DROP CONSTRAINT "ShopApplication_userId_fkey";

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "ShopApplication";

-- DropEnum
DROP TYPE "ApplicationStatus";
