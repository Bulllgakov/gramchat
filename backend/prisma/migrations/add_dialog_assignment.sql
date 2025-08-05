-- Добавляем поля для назначения диалогов
ALTER TABLE "Dialog" 
ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "assignedAt" TIMESTAMP(3);

-- Создаем связь с таблицей User
ALTER TABLE "Dialog"
ADD CONSTRAINT "Dialog_assignedToId_fkey" 
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Создаем индекс для быстрого поиска по назначенному менеджеру
CREATE INDEX "Dialog_assignedToId_idx" ON "Dialog"("assignedToId");