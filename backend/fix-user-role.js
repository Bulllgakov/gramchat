const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRole() {
  try {
    const userTelegramId = BigInt('8384084241');
    
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: userTelegramId }
    });

    if (existingUser) {
      // Обновляем пользователя с роли ADMIN на OWNER
      const updatedUser = await prisma.user.update({
        where: { telegramId: userTelegramId },
        data: {
          role: 'OWNER',
          hasFullAccess: false, // По умолчанию без полного доступа
          isActive: true
        }
      });
      
      console.log('✅ Пользователь обновлен с ADMIN на OWNER:', {
        id: updatedUser.id,
        telegramId: updatedUser.telegramId.toString(),
        firstName: updatedUser.firstName,
        role: updatedUser.role,
        hasFullAccess: updatedUser.hasFullAccess
      });
    } else {
      console.log('❌ Пользователь с ID 8384084241 не найден в базе данных');
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRole();