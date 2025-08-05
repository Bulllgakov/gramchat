-- AlterTable
ALTER TABLE "User" 
ALTER COLUMN "telegramId" DROP NOT NULL,
ADD COLUMN "email" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "requirePasswordChange" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");