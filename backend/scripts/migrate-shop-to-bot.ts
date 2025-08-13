#!/usr/bin/env ts-node

/**
 * Скрипт миграции с модели Shop на модель Bot
 * Запуск: npx ts-node scripts/migrate-shop-to-bot.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateShopToBot() {
  console.log('🚀 Начинаем миграцию Shop → Bot...\n');

  try {
    // 1. Проверяем существующие данные
    const shopsCount = await prisma.shop.count();
    const existingBotsCount = await prisma.bot.count();
    
    console.log(`📊 Найдено магазинов: ${shopsCount}`);
    console.log(`📊 Существующих ботов: ${existingBotsCount}`);
    
    if (existingBotsCount > 0) {
      console.log('⚠️  Боты уже существуют. Пропускаем миграцию.');
      return;
    }

    // 2. Начинаем транзакцию
    await prisma.$transaction(async (tx) => {
      console.log('\n📋 Копируем данные из Shop в Bot...');
      
      // Получаем все магазины
      const shops = await tx.shop.findMany({
        include: {
          dialogs: true,
          inviteCodes: true,
          managers: true,
        }
      });

      for (const shop of shops) {
        console.log(`\n  → Мигрируем магазин: ${shop.name} (@${shop.botUsername})`);
        
        // Создаем бота
        const bot = await tx.bot.create({
          data: {
            id: shop.id, // Сохраняем тот же ID для простоты
            name: shop.name,
            botToken: shop.botToken,
            botUsername: shop.botUsername,
            category: shop.category,
            ownerId: shop.ownerId,
            isActive: shop.isActive,
            isApproved: shop.isApproved,
            createdAt: shop.createdAt,
            updatedAt: shop.updatedAt,
          }
        });
        
        console.log(`    ✅ Бот создан: ${bot.id}`);
        
        // Мигрируем менеджеров
        if (shop.managers.length > 0) {
          console.log(`    → Мигрируем ${shop.managers.length} менеджеров...`);
          
          for (const manager of shop.managers) {
            await tx.botManager.create({
              data: {
                botId: bot.id,
                userId: manager.id,
                assignedBy: shop.ownerId,
                assignedAt: manager.createdAt,
              }
            });
          }
          console.log(`    ✅ Менеджеры мигрированы`);
        }
        
        // Обновляем диалоги
        if (shop.dialogs.length > 0) {
          console.log(`    → Обновляем ${shop.dialogs.length} диалогов...`);
          
          await tx.dialog.updateMany({
            where: { shopId: shop.id },
            data: { botId: bot.id }
          });
          console.log(`    ✅ Диалоги обновлены`);
        }
        
        // Обновляем инвайт-коды
        if (shop.inviteCodes.length > 0) {
          console.log(`    → Обновляем ${shop.inviteCodes.length} инвайт-кодов...`);
          
          await tx.inviteCode.updateMany({
            where: { shopId: shop.id },
            data: { botId: bot.id }
          });
          console.log(`    ✅ Инвайт-коды обновлены`);
        }
      }
      
      // Убираем managedShopId у пользователей
      console.log('\n📋 Очищаем старые связи менеджеров...');
      await tx.user.updateMany({
        where: { managedShopId: { not: null } },
        data: { managedShopId: null }
      });
      
      console.log('✅ Старые связи очищены');
    });

    // 3. Проверяем результаты
    const botsCount = await prisma.bot.count();
    const botManagersCount = await prisma.botManager.count();
    const dialogsWithBot = await prisma.dialog.count({
      where: { botId: { not: null } }
    });
    
    console.log('\n📊 Результаты миграции:');
    console.log(`  ✅ Ботов создано: ${botsCount}`);
    console.log(`  ✅ Связей менеджер-бот: ${botManagersCount}`);
    console.log(`  ✅ Диалогов с ботами: ${dialogsWithBot}`);
    
    console.log('\n🎉 Миграция завершена успешно!');
    console.log('\n⚠️  Важно:');
    console.log('  1. Обновите код приложения для работы с Bot вместо Shop');
    console.log('  2. После проверки работоспособности можно удалить таблицу Shop');
    console.log('  3. Не забудьте обновить Prisma схему');
    
  } catch (error) {
    console.error('\n❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateShopToBot();