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
router.post('/create', authenticate, authorize('OWNER'), requireFullAccess, async (req, res, next) => {
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

    // Проверяем, что у владельца есть магазин
    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { ownedShop: true }
    });

    if (!owner?.ownedShop) {
      return res.status(403).json({ 
        error: 'У вас нет магазина для добавления менеджеров' 
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
        shopId: owner.ownedShop.id,
        comment: comment || `Инвайт для менеджера ${firstName} ${lastName || ''}`.trim()
      }
    });

    res.json({
      success: true,
      inviteCode: {
        code: inviteCode.code,
        comment: inviteCode.comment,
        shopName: owner.ownedShop.name,
        message: `Инвайт-код создан. Передайте код ${inviteCode.code} менеджеру для авторизации через Telegram`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Создание нового инвайт-кода для менеджера (замена сброса пароля)
router.post('/reset-access', authenticate, authorize('OWNER'), requireFullAccess, async (req, res, next) => {
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
        ownedShop: {
          include: {
            managers: {
              where: { id: userId }
            }
          }
        }
      }
    });

    if (!owner?.ownedShop || owner.ownedShop.managers.length === 0) {
      return res.status(403).json({ 
        error: 'У вас нет прав для управления этим пользователем' 
      });
    }

    const manager = owner.ownedShop.managers[0];

    // Деактивируем старые инвайт-коды этого менеджера
    await prisma.inviteCode.updateMany({
      where: {
        shopId: owner.ownedShop.id,
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
        shopId: owner.ownedShop.id,
        comment: comment || `Новый инвайт для ${manager.firstName} ${manager.lastName || ''}`.trim()
      }
    });

    res.json({
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
router.get('/list', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const currentUser = req.user!;

    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        ownedShop: {
          include: {
            managers: {
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
    });

    if (!owner?.ownedShop) {
      return res.status(403).json({ 
        error: 'У вас нет магазина' 
      });
    }

    res.json({
      success: true,
      managers: owner.ownedShop.managers
    });
  } catch (error) {
    next(error);
  }
});

// Удаление менеджера из магазина (для OWNER)
router.delete('/:managerId', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { managerId } = req.params;
    const currentUser = req.user!;

    // Проверяем права владельца
    const owner = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        ownedShop: {
          include: {
            managers: {
              where: { id: managerId }
            }
          }
        }
      }
    });

    if (!owner?.ownedShop || owner.ownedShop.managers.length === 0) {
      return res.status(403).json({ 
        error: 'У вас нет прав для удаления этого менеджера' 
      });
    }

    // Удаляем связь менеджера с магазином
    await prisma.user.update({
      where: { id: managerId },
      data: {
        managedShopId: null,
        isActive: false
      }
    });

    res.json({
      success: true,
      message: 'Менеджер успешно удален из магазина'
    });
  } catch (error) {
    next(error);
  }
});

export default router;