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

const createShopSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1),
  botUsername: z.string().min(1),
  category: z.string().min(1)
});

// Middleware для проверки, что у владельца есть магазин
const requireShop = async (req: any, res: any, next: any) => {
  const shop = await prisma.shop.findUnique({
    where: { ownerId: req.user!.id }
  });
  
  if (!shop) {
    return next(new AppError(403, 'У вас нет магазина'));
  }
  
  req.shop = shop;
  next();
};

// Создание магазина (доступно без requireShop)
router.post('/shop', authenticate, authorize('OWNER'), createResourceLimiter, async (req, res, next) => {
  try {
    const data = createShopSchema.parse(req.body);
    
    // Проверяем, нет ли уже магазина у пользователя
    const existingShop = await prisma.shop.findUnique({
      where: { ownerId: req.user!.id }
    });
    
    if (existingShop) {
      throw new AppError(400, 'У вас уже есть магазин');
    }
    
    // Проверяем уникальность токена и username бота
    const botTokenExists = await prisma.shop.findUnique({
      where: { botToken: data.botToken }
    });
    
    if (botTokenExists) {
      throw new AppError(400, 'Этот токен бота уже используется');
    }
    
    const botUsernameExists = await prisma.shop.findUnique({
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
    
    // Если регистрация была по инвайт-коду - магазин сразу одобрен
    const isApproved = !!user?.inviteCode;
    
    // Создаем магазин
    const shop = await prisma.shop.create({
      data: {
        ...data,
        ownerId: req.user!.id,
        isApproved
      }
    });
    
    res.status(201).json({
      shop,
      message: isApproved 
        ? 'Магазин создан и готов к работе' 
        : 'Магазин создан. Ожидайте одобрения администратора для доступа к полному функционалу'
    });
  } catch (error) {
    next(error);
  }
});

// Middleware для проверки одобрения магазина
const requireApprovedShop = async (req: any, res: any, next: any) => {
  if (!req.shop!.isApproved) {
    return next(new AppError(403, 'Ваш магазин ожидает одобрения администратора. Эта функция будет доступна после одобрения'));
  }
  next();
};

// Все остальные роуты требуют роль OWNER и наличие магазина
router.use(authenticate, authorize('OWNER'), requireShop);

// Получить список инвайт-кодов
router.get('/invite-codes', async (req, res, next) => {
  try {
    const codes = await prisma.inviteCode.findMany({
      where: { 
        shopId: req.shop!.id,
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

// Создать инвайт-код для менеджера (требует одобренный магазин)
router.post('/invite-codes', requireApprovedShop, createResourceLimiter, async (req, res, next) => {
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
        shopId: req.shop!.id
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
        shopId: req.shop!.id
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

// Получить список менеджеров магазина
router.get('/managers', async (req, res, next) => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        managedShopId: req.shop!.id,
        role: 'MANAGER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        isActive: true,
        createdAt: true,
        requirePasswordChange: true,
        inviteCode: {
          select: {
            code: true,
            comment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ managers });
  } catch (error) {
    next(error);
  }
});

// Удалить менеджера из магазина
router.delete('/managers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const manager = await prisma.user.findFirst({
      where: {
        id,
        managedShopId: req.shop!.id,
        role: 'MANAGER'
      }
    });

    if (!manager) {
      throw new AppError(404, 'Менеджер не найден');
    }

    // Убираем менеджера из магазина
    await prisma.user.update({
      where: { id },
      data: { 
        managedShopId: null,
        isActive: false 
      }
    });

    res.json({ message: 'Менеджер удален из магазина' });
  } catch (error) {
    next(error);
  }
});

// Переключить активность менеджера
router.patch('/managers/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const manager = await prisma.user.findFirst({
      where: {
        id,
        managedShopId: req.shop!.id,
        role: 'MANAGER'
      }
    });

    if (!manager) {
      throw new AppError(404, 'Менеджер не найден');
    }

    const updatedManager = await prisma.user.update({
      where: { id },
      data: { isActive: !manager.isActive }
    });

    res.json(updatedManager);
  } catch (error) {
    next(error);
  }
});

export default router;