-- Фаза 1: Создание новой структуры параллельно со старой

-- 1. Создаем таблицу Bot (копия Shop с небольшими изменениями)
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

-- 2. Создаем промежуточную таблицу для связи Bot-Manager
CREATE TABLE "BotManager" (
  "id" TEXT NOT NULL,
  "botId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assignedBy" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BotManager_pkey" PRIMARY KEY ("id")
);

-- 3. Добавляем поле botId в существующие таблицы
ALTER TABLE "Dialog" ADD COLUMN "botId" TEXT;
ALTER TABLE "InviteCode" ADD COLUMN "botId" TEXT;

-- 4. Создаем индексы
CREATE UNIQUE INDEX "Bot_botToken_key" ON "Bot"("botToken");
CREATE UNIQUE INDEX "Bot_botUsername_key" ON "Bot"("botUsername");
CREATE UNIQUE INDEX "BotManager_botId_userId_key" ON "BotManager"("botId", "userId");
CREATE INDEX "BotManager_userId_idx" ON "BotManager"("userId");
CREATE INDEX "BotManager_botId_idx" ON "BotManager"("botId");
CREATE INDEX "Dialog_botId_idx" ON "Dialog"("botId");

-- 5. Добавляем внешние ключи
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_ownerId_fkey" 
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BotManager" ADD CONSTRAINT "BotManager_botId_fkey" 
  FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BotManager" ADD CONSTRAINT "BotManager_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BotManager" ADD CONSTRAINT "BotManager_assignedBy_fkey" 
  FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Dialog" ADD CONSTRAINT "Dialog_botId_fkey" 
  FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_botId_fkey" 
  FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE SET NULL ON UPDATE CASCADE;