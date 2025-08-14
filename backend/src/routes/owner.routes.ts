import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { nanoid } from 'nanoid';
import { createResourceLimiter } from '../middleware/rateLimiter';

const router = Router();

const createInviteSchema = z.object({
  comment: z.string().optional(),
  maxUses: z.number().min(1).max(100).default(1),
  expiresInDays: z.number().min(1).max(365).optional()
});

const createBotSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1),
  botUsername: z.string().min(1),
  category: z.string().min(1)
});

// Middleware для проверки, что у владельца есть боты
const requireBot = async (req: any, res: any, next: any) => {
  const bots = await prisma.bot.findMany({
    where: { ownerId: req.user!.id }
  });
  
  if (!bots || bots.length === 0) {
    return next(new AppError(403, 'У вас нет ботов'));
  }
  
  req.bots = bots;
  req.bot = bots[0]; // Первый бот как основной
  next();
};

// Создание бота (доступно без requireBot)
router.post('/bot', authenticate, authorize('OWNER'), createResourceLimiter, async (req, res, next) => {
  try {
    const data = createBotSchema.parse(req.body);
    
    // Проверяем лимит ботов у пользователя (максимум 3 бота)
    const existingBotsCount = await prisma.bot.count({
      where: { ownerId: req.user!.id }
    });
    
    if (existingBotsCount >= 3) {
      throw new AppError(400, 'У вас уже максимальное количество ботов (3)');
    }
    
    // Проверяем уникальность токена и username бота
    const botTokenExists = await prisma.bot.findUnique({
      where: { botToken: data.botToken }
    });
    
    if (botTokenExists) {
      throw new AppError(400, 'Этот токен бота уже используется');
    }
    
    const botUsernameExists = await prisma.bot.findUnique({
      where: { botUsername: data.botUsername }
    });
    
    if (botUsernameExists) {
      throw new AppError(400, 'Этот username бота уже используется');
    }
    
    // Проверяем, есть ли у пользователя инвайт-код
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { inviteCode: true }
    });
    
    // Если регистрация была по инвайт-коду - бот сразу одобрен
    const isApproved = !!user?.inviteCode;
    
    // Создаем бот
    const bot = await prisma.bot.create({
      data: {
        ...data,
        ownerId: req.user!.id,
        isApproved
      }
    });
    
    res.status(201).json({
      bot,
      message: isApproved 
        ? 'Бот создан и готов к работе' 
        : 'Бот создан. Ожидайте одобрения администратора для доступа к полному функционалу'
    });
  } catch (error) {
    next(error);
  }
});

// Middleware для проверки одобрения бота
const requireApprovedBot = async (req: any, res: any, next: any) => {
  if (!req.bot!.isApproved) {
    return next(new AppError(403, 'Ваш бот ожидает одобрения администратора. Эта функция будет доступна после одобрения'));
  }
  next();
};

// Все остальные роуты требуют роль OWNER и наличие ботов
router.use(authenticate, authorize('OWNER'), requireBot);

// Получить список инвайт-кодов
router.get('/invite-codes', async (req, res, next) => {
  try {
    const codes = await prisma.inviteCode.findMany({
      where: { 
        botId: { in: req.bots!.map((bot: any) => bot.id) },
        createdById: req.user!.id
      },
      include: {
        usedByUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ codes });
  } catch (error) {
    next(error);
  }
});

// Создать инвайт-код для менеджера (требует одобренный бот)
router.post('/invite-codes', requireApprovedBot, createResourceLimiter, async (req, res, next) => {
  try {
    const data = createInviteSchema.parse(req.body);
    
    const expiresAt = data.expiresInDays 
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const code = await prisma.inviteCode.create({
      data: {
        code: nanoid(8).toUpperCase(),
        type: data.maxUses > 1 ? 'MULTI' : 'SINGLE',
        role: 'MANAGER',
        maxUses: data.maxUses,
        expiresAt,
        comment: data.comment,
        createdById: req.user!.id,
        botId: req.bot!.id
      }
    });

    res.status(201).json(code);
  } catch (error) {
    next(error);
  }
});

// Деактивировать инвайт-код
router.patch('/invite-codes/:id/deactivate', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const code = await prisma.inviteCode.findFirst({
      where: {
        id,
        createdById: req.user!.id,
        botId: { in: req.bots!.map((bot: any) => bot.id) }
      }
    });

    if (!code) {
      throw new AppError(404, 'Инвайт-код не найден');
    }

    const updatedCode = await prisma.inviteCode.update({
      where: { id },
      data: { isActive: false }
    });

    res.json(updatedCode);
  } catch (error) {
    next(error);
  }
});

// Получить список менеджеров ботов
router.get('/managers', async (req, res, next) => {
  try {
    const managers = await prisma.botManager.findMany({
      where: {
        botId: { in: req.bots!.map((bot: any) => bot.id) }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isActive: true,
            createdAt: true,
            inviteCode: {
              select: {
                code: true,
                comment: true
              }
            }
          }
        },
        bot: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Преобразуем данные для фронтенда
    const managersData = managers.map(botManager => ({
      id: botManager.user.id,
      firstName: botManager.user.firstName,
      lastName: botManager.user.lastName,
      username: botManager.user.username,
      isActive: botManager.user.isActive,
      createdAt: botManager.user.createdAt,
      inviteCode: botManager.user.inviteCode,
      bot: botManager.bot,
      assignedAt: botManager.assignedAt
    }));

    res.json({ managers: managersData });
  } catch (error) {
    next(error);
  }
});

// Удалить менеджера из ботов
router.delete('/managers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const botManager = await prisma.botManager.findFirst({
      where: {
        userId: id,
        botId: { in: req.bots!.map((bot: any) => bot.id) }
      },
      include: {
        user: true
      }
    });

    if (!botManager) {
      throw new AppError(404, 'Менеджер не найден');
    }

    // Удаляем связь менеджера с ботами
    await prisma.botManager.deleteMany({
      where: {
        userId: id,
        botId: { in: req.bots!.map((bot: any) => bot.id) }
      }
    });
    
    // Проверяем, остались ли у менеджера связи с другими ботами
    const remainingConnections = await prisma.botManager.count({
      where: { userId: id }
    });
    
    // Если нет других связей, деактивируем пользователя
    if (remainingConnections === 0) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
    }

    res.json({ message: 'Менеджер удален из ботов' });
  } catch (error) {
    next(error);
  }
});

// Переключить активность менеджера
router.patch('/managers/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const botManager = await prisma.botManager.findFirst({
      where: {
        userId: id,
        botId: { in: req.bots!.map((bot: any) => bot.id) }
      },
      include: {
        user: true
      }
    });

    if (!botManager) {
      throw new AppError(404, 'Менеджер не найден');
    }

    const updatedManager = await prisma.user.update({
      where: { id },
      data: { isActive: !botManager.user.isActive }
    });

    res.json(updatedManager);
  } catch (error) {
    next(error);
  }
});

export default router;