-- Миграция для добавления полей лимитов подписки

-- Переименовываем старые поля в новые (если они существуют)
DO $$ 
BEGIN
    -- Проверяем и переименовываем telegramBots в telegramBotsLimit
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscription' 
        AND column_name = 'telegramBots'
    ) THEN
        ALTER TABLE "Subscription" 
        RENAME COLUMN "telegramBots" TO "telegramBotsLimit";
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscription' 
        AND column_name = 'telegramBotsLimit'
    ) THEN
        ALTER TABLE "Subscription" 
        ADD COLUMN "telegramBotsLimit" INTEGER NOT NULL DEFAULT 1;
    END IF;

    -- Проверяем и переименовываем maxBots в maxBotsLimit
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscription' 
        AND column_name = 'maxBots'
    ) THEN
        ALTER TABLE "Subscription" 
        RENAME COLUMN "maxBots" TO "maxBotsLimit";
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscription' 
        AND column_name = 'maxBotsLimit'
    ) THEN
        ALTER TABLE "Subscription" 
        ADD COLUMN "maxBotsLimit" INTEGER NOT NULL DEFAULT 1;
    END IF;

    -- Добавляем новые поля для отслеживания использования
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscription' 
        AND column_name = 'telegramBotsUsed'
    ) THEN
        ALTER TABLE "Subscription" 
        ADD COLUMN "telegramBotsUsed" INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscription' 
        AND column_name = 'maxBotsUsed'
    ) THEN
        ALTER TABLE "Subscription" 
        ADD COLUMN "maxBotsUsed" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Обновляем лимиты для существующих подписок в соответствии с тарифными планами
UPDATE "Subscription" 
SET 
    "telegramBotsLimit" = CASE 
        WHEN "planType" = 'FREE' THEN 1
        WHEN "planType" = 'PRO' THEN 0  -- 0 означает безлимит
        WHEN "planType" = 'MAX' THEN 0  -- 0 означает безлимит
        ELSE 1
    END,
    "maxBotsLimit" = CASE 
        WHEN "planType" = 'FREE' THEN 1
        WHEN "planType" = 'PRO' THEN 0  -- 0 означает безлимит
        WHEN "planType" = 'MAX' THEN 0  -- 0 означает безлимит
        ELSE 1
    END;

-- Подсчитываем текущее использование ботов для каждого пользователя
UPDATE "Subscription" s
SET "telegramBotsUsed" = (
    SELECT COUNT(*) 
    FROM "Bot" b 
    WHERE b."ownerId" = s."userId" 
    AND b."isApproved" = true
);

-- Создаем подписки для пользователей, у которых их еще нет
-- Для владельцев без модерации даем возможность подключить 1 Telegram и 1 MAX бот
INSERT INTO "Subscription" (
    "id",
    "userId", 
    "planType", 
    "telegramBotsLimit",
    "maxBotsLimit",
    "telegramBotsUsed",
    "maxBotsUsed",
    "dialogsUsed",
    "dialogsLimit",
    "managersLimit",
    "pricePerBot",
    "totalPrice",
    "isActive",
    "isTrial",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    u."id",
    'FREE',
    1,  -- Лимит 1 Telegram бот
    1,  -- Лимит 1 MAX бот
    COALESCE((SELECT COUNT(*) FROM "Bot" WHERE "ownerId" = u."id" AND "isApproved" = true), 0),
    0,
    0,
    100,
    1,
    0,
    0,
    true,
    false,
    NOW(),
    NOW()
FROM "User" u
WHERE u."role" = 'OWNER'
AND NOT EXISTS (
    SELECT 1 FROM "Subscription" s WHERE s."userId" = u."id"
);

-- Автоматически одобряем существующие боты в рамках лимитов
WITH bot_approval AS (
    SELECT 
        b."id",
        b."ownerId",
        ROW_NUMBER() OVER (PARTITION BY b."ownerId" ORDER BY b."createdAt") as bot_num,
        s."telegramBotsLimit" + s."maxBotsLimit" as total_limit
    FROM "Bot" b
    JOIN "Subscription" s ON s."userId" = b."ownerId"
    WHERE b."isApproved" = false
)
UPDATE "Bot" 
SET "isApproved" = true
FROM bot_approval
WHERE "Bot"."id" = bot_approval."id"
AND (
    bot_approval.total_limit = 0  -- Безлимитный тариф
    OR bot_approval.bot_num <= bot_approval.total_limit  -- В рамках лимита
);

-- Обновляем счетчики использованных ботов после автоматического одобрения
UPDATE "Subscription" s
SET "telegramBotsUsed" = (
    SELECT COUNT(*) 
    FROM "Bot" b 
    WHERE b."ownerId" = s."userId" 
    AND b."isApproved" = true
);