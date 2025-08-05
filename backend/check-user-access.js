const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndUpdateUserAccess() {
  try {
    const userTelegramId = BigInt('8384084241');
    
    // Проверяем текущий статус пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: userTelegramId },
      include: {
        ownedShop: true,
        inviteCode: true
      }
    });

    if (!user) {
      console.log('❌ Пользователь с ID 8384084241 не найден');
      return;
    }

    console.log('📊 Текущий статус пользователя:');
    console.log({
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hasFullAccess: user.hasFullAccess,
      isActive: user.isActive,
      inviteCodeUsed: user.inviteCode ? user.inviteCode.code : 'Без инвайт-кода',
      hasShop: !!user.ownedShop,
      shopName: user.ownedShop?.name
    });

    if (user.role === 'OWNER' && !user.hasFullAccess) {
      console.log('\n⚠️  Владелец имеет ограниченный доступ!');
      
      // Спрашиваем, нужно ли обновить
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\nПредоставить полный доступ? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { hasFullAccess: true }
          });
          
          console.log('\n✅ Полный доступ предоставлен!');
          console.log({
            id: updatedUser.id,
            firstName: updatedUser.firstName,
            role: updatedUser.role,
            hasFullAccess: updatedUser.hasFullAccess
          });
        } else {
          console.log('\n❌ Обновление отменено');
        }
        
        rl.close();
        await prisma.$disconnect();
      });
    } else if (user.hasFullAccess) {
      console.log('\n✅ Пользователь уже имеет полный доступ');
      await prisma.$disconnect();
    } else {
      console.log('\n❓ Пользователь не является владельцем');
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Ошибка:', error);
    await prisma.$disconnect();
  }
}

checkAndUpdateUserAccess();