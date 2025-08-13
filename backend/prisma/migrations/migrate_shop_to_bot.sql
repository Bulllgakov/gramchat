-- Фаза 2: Миграция данных из Shop в Bot

-- 1. Копируем все данные из Shop в Bot
INSERT INTO "Bot" (
  "id",
  "name",
  "botToken",
  "botUsername",
  "category",
  "ownerId",
  "isActive",
  "isApproved",
  "createdAt",
  "updatedAt"
)
SELECT 
  "id",
  "name",
  "botToken",
  "botUsername",
  "category",
  "ownerId",
  "isActive",
  "isApproved",
  "createdAt",
  "updatedAt"
FROM "Shop";

-- 2. Мигрируем связи менеджеров
INSERT INTO "BotManager" ("id", "botId", "userId", "assignedBy", "assignedAt")
SELECT 
  gen_random_uuid()::text,
  u."managedShopId",
  u."id",
  s."ownerId",
  u."createdAt"
FROM "User" u
INNER JOIN "Shop" s ON s."id" = u."managedShopId"
WHERE u."managedShopId" IS NOT NULL;

-- 3. Обновляем Dialog - добавляем botId
UPDATE "Dialog" d
SET "botId" = d."shopId";

-- 4. Обновляем InviteCode - добавляем botId  
UPDATE "InviteCode" i
SET "botId" = i."shopId";

-- 5. Добавляем NOT NULL constraint после миграции данных
ALTER TABLE "Dialog" ALTER COLUMN "botId" SET NOT NULL;