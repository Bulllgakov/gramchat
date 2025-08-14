import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { requireFullAccess } from '../middleware/ownerAccess';
// Password utils and email service no longer needed - managers use invite codes only

const router = Router();

// Схема валидации для создания менеджера
const createManagerSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().optional(),
  comment: z.string().optional() // Комментарий к инвайт-коду
});

// Password reset schemas no longer needed - invite codes only

// Создание инвайт-кода для менеджера (только для OWNER с полным доступом)
router.post('/create', authenticate, authorize('OWNER'), requireFullAccess, async (req: any, res: any, next: any) => {
  try {
    const validation = createManagerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { firstName, lastName, comment } = validation.data;
    const currentUser = req.user!;

    // Проверяем, что у владельца есть боты
    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { ownedBots: true }
    });

    if (!owner?.ownedBots || owner.ownedBots.length === 0) {
      return res.status(403).json({ 
        error: 'У вас нет ботов для добавления менеджеров' 
      });
    }

    // Генерируем инвайт-код
    const { nanoid } = await import('nanoid');
    const inviteCode = await prisma.inviteCode.create({
      data: {
        code: nanoid(8).toUpperCase(),
        type: 'SINGLE',
        role: 'MANAGER',
        maxUses: 1,
        usedCount: 0,
        isActive: true,
        createdById: currentUser.id,
        botId: owner.ownedBots[0].id, // Берем первый бот владельца
        comment: comment || `Инвайт для менеджера ${firstName} ${lastName || ''}`.trim()
      }
    });

    return res.json({
      success: true,
      inviteCode: {
        code: inviteCode.code,
        comment: inviteCode.comment,
        botName: owner.ownedBots[0].name,
        message: `Инвайт-код создан. Передайте код ${inviteCode.code} менеджеру для авторизации через Telegram`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Создание нового инвайт-кода для менеджера (замена сброса пароля)
router.post('/reset-access', authenticate, authorize('OWNER'), requireFullAccess, async (req: any, res: any, next: any) => {
  try {
    const resetSchema = z.object({
      userId: z.string().uuid('Некорректный ID пользователя'),
      comment: z.string().optional()
    });

    const validation = resetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { userId, comment } = validation.data;
    const currentUser = req.user!;

    // Проверяем, что владелец управляет этим менеджером
    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { 
        ownedBots: {
          include: {
            managers: {
              include: {
                user: true
              },
              where: { userId: userId }
            }
          }
        }
      }
    });

    const botWithManager = owner?.ownedBots?.find(bot => bot.managers.length > 0);
    if (!botWithManager) {
      return res.status(403).json({ 
        error: 'У вас нет прав для управления этим пользователем' 
      });
    }

    const manager = botWithManager.managers[0].user;

    // Деактивируем старые инвайт-коды этого менеджера
    await prisma.inviteCode.updateMany({
      where: {
        botId: botWithManager.id,
        role: 'MANAGER',
        usedByUsers: {
          some: {
            id: userId
          }
        }
      },
      data: {
        isActive: false
      }
    });

    // Создаем новый инвайт-код
    const { nanoid } = await import('nanoid');
    const inviteCode = await prisma.inviteCode.create({
      data: {
        code: nanoid(8).toUpperCase(),
        type: 'SINGLE',
        role: 'MANAGER',
        maxUses: 1,
        usedCount: 0,
        isActive: true,
        createdById: currentUser.id,
        botId: botWithManager.id,
        comment: comment || `Новый инвайт для ${manager.firstName} ${manager.lastName || ''}`.trim()
      }
    });

    return res.json({
      success: true,
      inviteCode: {
        code: inviteCode.code,
        comment: inviteCode.comment,
        message: `Новый инвайт-код создан для ${manager.firstName}. Код: ${inviteCode.code}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Получение списка менеджеров магазина (для OWNER)
router.get('/list', authenticate, authorize('OWNER'), async (req: any, res: any, next: any) => {
  try {
    const currentUser = req.user!;

    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        ownedBots: {
          include: {
            managers: {
              include: {
                user: {
                  select: {
                    id: true,
                    telegramId: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    hasFullAccess: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!owner?.ownedBots || owner.ownedBots.length === 0) {
      return res.status(403).json({ 
        error: 'У вас нет ботов' 
      });
    }

    // Собираем всех менеджеров из всех ботов владельца
    const allManagers = owner.ownedBots.flatMap(bot => 
      bot.managers.map(manager => manager.user)
    );
    
    // Убираем дубликаты по ID (если менеджер работает с несколькими ботами)
    const uniqueManagers = allManagers.filter((manager, index, array) => 
      array.findIndex(m => m.id === manager.id) === index
    );

    return res.json({
      success: true,
      managers: uniqueManagers
    });
  } catch (error) {
    next(error);
  }
});

// Удаление менеджера из магазина (для OWNER)
router.delete('/:managerId', authenticate, authorize('OWNER'), async (req: any, res: any, next: any) => {
  try {
    const { managerId } = req.params;
    const currentUser = req.user!;

    // Проверяем права владельца
    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        ownedBots: {
          include: {
            managers: {
              include: {
                user: true
              },
              where: { userId: managerId }
            }
          }
        }
      }
    });

    const botWithManager = owner?.ownedBots?.find(bot => bot.managers.length > 0);
    if (!botWithManager) {
      return res.status(403).json({ 
        error: 'У вас нет прав для удаления этого менеджера' 
      });
    }

    // Удаляем связи менеджера со всеми ботами владельца
    await prisma.botManager.deleteMany({
      where: {
        userId: managerId,
        botId: {
          in: owner!.ownedBots!.map(bot => bot.id)
        }
      }
    });
    
    // Деактивируем менеджера, если он больше не управляет никакими ботами
    const remainingBotConnections = await prisma.botManager.count({
      where: { userId: managerId }
    });
    
    if (remainingBotConnections === 0) {
      await prisma.user.update({
        where: { id: managerId },
        data: { isActive: false }
      });
    }

    return res.json({
      success: true,
      message: 'Менеджер успешно удален из ботов'
    });
  } catch (error) {
    next(error);
  }
});

export default router;