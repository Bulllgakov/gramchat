import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { requireFullAccess } from '../middleware/ownerAccess';
import { AppError } from '../middleware/errorHandler';
import { nanoid } from 'nanoid';

const router = Router();

// ============ ИНВАЙТ-КОДЫ ============

// Создание общего инвайт-кода (без привязки к ботам)
const createInviteCodeSchema = z.object({
  comment: z.string().optional(),
  maxUses: z.number().default(1),
  expiresInDays: z.number().optional()
});

router.post('/invite-codes', authenticate, authorize('OWNER'), requireFullAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createInviteCodeSchema.parse(req.body);
    
    // Генерируем уникальный код
    const code = nanoid(8).toUpperCase();
    
    // Вычисляем дату истечения
    const expiresAt = data.expiresInDays 
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        type: data.maxUses === 1 ? 'SINGLE' : 'MULTI',
        role: 'MANAGER',
        maxUses: data.maxUses,
        comment: data.comment,
        expiresAt,
        createdById: req.user!.id
      }
    });
    
    res.json({
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt,
      comment: inviteCode.comment
    });
  } catch (error) {
    next(error);
  }
});

// Получить список созданных инвайт-кодов
router.get('/invite-codes', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inviteCodes = await prisma.inviteCode.findMany({
      where: {
        createdById: req.user!.id
      },
      include: {
        usedByUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(inviteCodes);
  } catch (error) {
    next(error);
  }
});

// ============ УПРАВЛЕНИЕ МЕНЕДЖЕРАМИ И БОТАМИ ============

// Получить список всех менеджеров владельца
router.get('/managers', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Находим всех менеджеров, которые использовали инвайт-коды владельца
    const managers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        inviteCode: {
          createdById: req.user!.id
        }
      },
      include: {
        managedBots: {
          include: {
            bot: {
              select: {
                id: true,
                name: true,
                botUsername: true
              }
            }
          }
        }
      }
    });
    
    // Форматируем ответ
    const formattedManagers = managers.map(manager => ({
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      username: manager.username,
      isActive: manager.isActive,
      createdAt: manager.createdAt,
      assignedBots: manager.managedBots.map(mb => mb.bot)
    }));
    
    res.json(formattedManagers);
  } catch (error) {
    next(error);
  }
});

// Получить боты, назначенные конкретному менеджеру
router.get('/managers/:managerId/bots', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId } = req.params;
    
    // Проверяем, что менеджер относится к владельцу
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: 'MANAGER',
        inviteCode: {
          createdById: req.user!.id
        }
      },
      include: {
        managedBots: {
          include: {
            bot: true
          }
        }
      }
    });
    
    if (!manager) {
      throw new AppError(404, 'Менеджер не найден');
    }
    
    const bots = manager.managedBots.map(mb => mb.bot);
    res.json(bots);
  } catch (error) {
    next(error);
  }
});

// Обновить список ботов для менеджера (полная замена)
const updateManagerBotsSchema = z.object({
  botIds: z.array(z.string())
});

router.put('/managers/:managerId/bots', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId } = req.params;
    const { botIds } = updateManagerBotsSchema.parse(req.body);
    
    // Проверяем, что менеджер относится к владельцу
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: 'MANAGER',
        inviteCode: {
          createdById: req.user!.id
        }
      }
    });
    
    if (!manager) {
      throw new AppError(404, 'Менеджер не найден');
    }
    
    // Проверяем, что все боты принадлежат владельцу
    const ownerBots = await prisma.bot.findMany({
      where: {
        id: { in: botIds },
        ownerId: req.user!.id
      }
    });
    
    if (ownerBots.length !== botIds.length) {
      throw new AppError(400, 'Некоторые боты не найдены или не принадлежат вам');
    }
    
    // Транзакция для обновления связей
    await prisma.$transaction(async (tx) => {
      // Удаляем старые связи
      await tx.botManager.deleteMany({
        where: { userId: managerId }
      });
      
      // Создаем новые связи
      if (botIds.length > 0) {
        await tx.botManager.createMany({
          data: botIds.map(botId => ({
            botId,
            userId: managerId,
            assignedBy: req.user!.id
          }))
        });
      }
    });
    
    // Отправляем уведомление менеджеру через Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${managerId}`).emit('bots-updated', {
        botIds,
        message: botIds.length > 0 
          ? 'Вам назначены новые боты' 
          : 'Доступ к ботам отозван'
      });
    }
    
    res.json({ 
      success: true,
      assignedBots: botIds.length 
    });
  } catch (error) {
    next(error);
  }
});

// Добавить бота менеджеру (не удаляя существующие)
router.post('/managers/:managerId/bots/:botId', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId, botId } = req.params;
    
    // Проверки доступа...
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: 'MANAGER',
        inviteCode: {
          createdById: req.user!.id
        }
      }
    });
    
    if (!manager) {
      throw new AppError(404, 'Менеджер не найден');
    }
    
    const bot = await prisma.bot.findFirst({
      where: {
        id: botId,
        ownerId: req.user!.id
      }
    });
    
    if (!bot) {
      throw new AppError(404, 'Бот не найден');
    }
    
    // Проверяем, нет ли уже такой связи
    const existing = await prisma.botManager.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: managerId
        }
      }
    });
    
    if (existing) {
      throw new AppError(400, 'Менеджер уже имеет доступ к этому боту');
    }
    
    // Создаем связь
    await prisma.botManager.create({
      data: {
        botId,
        userId: managerId,
        assignedBy: req.user!.id
      }
    });
    
    // Уведомление
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${managerId}`).emit('bot-added', {
        bot: {
          id: bot.id,
          name: bot.name,
          botUsername: bot.botUsername
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Удалить бота у менеджера
router.delete('/managers/:managerId/bots/:botId', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId, botId } = req.params;
    
    // Проверки доступа...
    const result = await prisma.botManager.deleteMany({
      where: {
        userId: managerId,
        botId: botId,
        bot: {
          ownerId: req.user!.id
        }
      }
    });
    
    if (result.count === 0) {
      throw new AppError(404, 'Связь не найдена');
    }
    
    // Уведомление
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${managerId}`).emit('bot-removed', { botId });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Удалить менеджера полностью
router.delete('/managers/:managerId', authenticate, authorize('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId } = req.params;
    
    // Проверяем, что менеджер относится к владельцу
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: 'MANAGER',
        inviteCode: {
          createdById: req.user!.id
        }
      }
    });
    
    if (!manager) {
      throw new AppError(404, 'Менеджер не найден');
    }
    
    // Удаляем все связи с ботами
    await prisma.botManager.deleteMany({
      where: { userId: managerId }
    });
    
    // Деактивируем пользователя (не удаляем, чтобы сохранить историю)
    await prisma.user.update({
      where: { id: managerId },
      data: { isActive: false }
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;