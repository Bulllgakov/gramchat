-- Создаем таблицу для отслеживания действий с диалогами
CREATE TABLE "DialogAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dialogId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- 'ASSIGNED', 'RELEASED', 'TRANSFERRED'
  "targetUserId" TEXT, -- для передачи диалога
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DialogAction_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DialogAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DialogAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Создаем индексы для быстрого поиска
CREATE INDEX "DialogAction_userId_idx" ON "DialogAction"("userId");
CREATE INDEX "DialogAction_dialogId_idx" ON "DialogAction"("dialogId");
CREATE INDEX "DialogAction_createdAt_idx" ON "DialogAction"("createdAt");
CREATE INDEX "DialogAction_action_idx" ON "DialogAction"("action");