-- Добавляем поля в таблицу InviteCode
ALTER TABLE "InviteCode" 
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
ADD COLUMN "shopId" TEXT,
ADD COLUMN "createdBy" TEXT;

-- Добавляем поле в таблицу User
ALTER TABLE "User" 
ADD COLUMN "inviteCodeId" TEXT;

-- Создаем связи
ALTER TABLE "InviteCode"
ADD CONSTRAINT "InviteCode_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "InviteCode_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;