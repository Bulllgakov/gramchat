-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ASSIGNED', 'RELEASED', 'TRANSFERRED');

-- CreateTable
CREATE TABLE "DialogAction" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "ActionType" NOT NULL,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DialogAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DialogAction_dialogId_idx" ON "DialogAction"("dialogId");

-- CreateIndex
CREATE INDEX "DialogAction_userId_idx" ON "DialogAction"("userId");

-- CreateIndex
CREATE INDEX "DialogAction_createdAt_idx" ON "DialogAction"("createdAt");

-- AddForeignKey
ALTER TABLE "DialogAction" ADD CONSTRAINT "DialogAction_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DialogAction" ADD CONSTRAINT "DialogAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DialogAction" ADD CONSTRAINT "DialogAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
