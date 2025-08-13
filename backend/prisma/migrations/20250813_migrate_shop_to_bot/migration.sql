-- CreateTable Bot and migrate data from Shop
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable BotManager
CREATE TABLE "BotManager" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotManager_pkey" PRIMARY KEY ("id")
);

-- Copy data from Shop to Bot
INSERT INTO "Bot" ("id", "name", "botToken", "botUsername", "category", "ownerId", "isActive", "isApproved", "createdAt", "updatedAt")
SELECT "id", "name", "botToken", "botUsername", "category", "ownerId", "isActive", "isApproved", "createdAt", "updatedAt"
FROM "Shop";

-- Add botId column to Dialog
ALTER TABLE "Dialog" ADD COLUMN "botId" TEXT;

-- Copy shopId to botId in Dialog
UPDATE "Dialog" SET "botId" = "shopId" WHERE "shopId" IS NOT NULL;

-- Make botId required
ALTER TABLE "Dialog" ALTER COLUMN "botId" SET NOT NULL;

-- Remove shopId from Dialog
ALTER TABLE "Dialog" DROP COLUMN "shopId";

-- Update InviteCode - rename shopId to botId
ALTER TABLE "InviteCode" RENAME COLUMN "shopId" TO "botId";

-- Update InviteCode - change createdById type and add it if not exists
ALTER TABLE "InviteCode" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
UPDATE "InviteCode" SET "createdById" = (SELECT "ownerId" FROM "Shop" WHERE "Shop"."id" = "InviteCode"."botId") WHERE "createdById" IS NULL;

-- Migrate managers from User.managedShopId to BotManager table
INSERT INTO "BotManager" ("id", "botId", "userId", "assignedBy", "assignedAt")
SELECT gen_random_uuid()::text, "managedShopId", "id", (SELECT "ownerId" FROM "Shop" WHERE "Shop"."id" = "managedShopId"), CURRENT_TIMESTAMP
FROM "User"
WHERE "managedShopId" IS NOT NULL;

-- Remove managedShopId from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "managedShopId";

-- Drop Shop table
DROP TABLE "Shop";

-- CreateIndex
CREATE UNIQUE INDEX "Bot_botToken_key" ON "Bot"("botToken");
CREATE UNIQUE INDEX "Bot_botUsername_key" ON "Bot"("botUsername");
CREATE UNIQUE INDEX "BotManager_botId_userId_key" ON "BotManager"("botId", "userId");
CREATE INDEX "BotManager_userId_idx" ON "BotManager"("userId");
CREATE INDEX "BotManager_botId_idx" ON "BotManager"("botId");

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotManager" ADD CONSTRAINT "BotManager_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotManager" ADD CONSTRAINT "BotManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotManager" ADD CONSTRAINT "BotManager_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dialog" ADD CONSTRAINT "Dialog_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;