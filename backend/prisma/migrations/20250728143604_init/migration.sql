-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'MANAGER');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('SINGLE', 'MULTI', 'PARTNER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DialogStatus" AS ENUM ('NEW', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'PHOTO', 'VIDEO', 'DOCUMENT', 'VOICE', 'STICKER', 'LOCATION');

-- CreateEnum
CREATE TYPE "CloseReason" AS ENUM ('DEAL', 'CANCELLED');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "username" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inviteCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managedShopId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CodeType" NOT NULL DEFAULT 'SINGLE',
    "role" "UserRole" NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "shopId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "botUsername" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT,
    "comment" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "inviteCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dialog" (
    "id" TEXT NOT NULL,
    "telegramChatId" BIGINT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerUsername" TEXT,
    "customerPhotoUrl" TEXT,
    "status" "DialogStatus" NOT NULL DEFAULT 'NEW',
    "shopId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "closeReason" "CloseReason",
    "closedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dialog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fromUser" BOOLEAN NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "telegramId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_botToken_key" ON "Shop"("botToken");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_botUsername_key" ON "Shop"("botUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_ownerId_key" ON "Shop"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "Dialog_shopId_status_idx" ON "Dialog"("shopId", "status");

-- CreateIndex
CREATE INDEX "Dialog_lastMessageAt_idx" ON "Dialog"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Dialog_assignedToId_idx" ON "Dialog"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Dialog_telegramChatId_shopId_key" ON "Dialog"("telegramChatId", "shopId");

-- CreateIndex
CREATE INDEX "Message_dialogId_createdAt_idx" ON "Message"("dialogId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managedShopId_fkey" FOREIGN KEY ("managedShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopApplication" ADD CONSTRAINT "ShopApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopApplication" ADD CONSTRAINT "ShopApplication_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dialog" ADD CONSTRAINT "Dialog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dialog" ADD CONSTRAINT "Dialog_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
