import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { nanoid } from 'nanoid';
import TelegramBot from 'node-telegram-bot-api';
import { createBot, removeBot } from '../services/telegram/botManager';

const router = Router();

// Generate invite code
function generateInviteCode(): string {
  return nanoid(8).toUpperCase();
}

const inviteCodeSchema = z.object({
  type: z.enum(['SINGLE', 'MULTI', 'PARTNER']),
  role: z.enum(['ADMIN', 'OWNER', 'MANAGER']),
  maxUses: z.number().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  comment: z.string().optional()
});


const createShopSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1),
  category: z.enum(['RETAIL', 'SERVICES', 'FOOD', 'ELECTRONICS', 'FASHION', 'HEALTH', 'OTHER']),
  ownerId: z.string()
});

const updateShopSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['RETAIL', 'SERVICES', 'FOOD', 'ELECTRONICS', 'FASHION', 'HEALTH', 'OTHER']).optional(),
  botToken: z.string().min(1).optional()
});

// Admin only routes
router.use(authenticate, authorize('ADMIN'));

// Get user detailed information
router.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        ownedShop: {
          include: {
            _count: {
              select: {
                dialogs: true,
                managers: true
              }
            }
          }
        },
        managedShop: {
          include: {
            owner: {
              select: {
                firstName: true,
                lastName: true,
                username: true
              }
            }
          }
        },
        inviteCode: {
          include: {
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const { role, isActive, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where,
      include: {
        ownedShop: {
          include: {
            _count: {
              select: {
                dialogs: true,
                managers: true
              }
            }
          }
        },
        managedShop: true,
        inviteCode: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all shops
router.get('/shops', async (req, res, next) => {
  try {
    const { isActive, category, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (category) where.category = category;

    const shops = await prisma.shop.findMany({
      where,
      include: {
        owner: true,
        _count: {
          select: { 
            managers: true,
            dialogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

    const total = await prisma.shop.count({ where });

    res.json({
      shops,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create invite code
router.post('/invite-codes', async (req, res, next) => {
  try {
    const data = inviteCodeSchema.parse(req.body);

    const code = await prisma.inviteCode.create({
      data: {
        code: nanoid(8).toUpperCase(),
        ...data,
        maxUses: data.maxUses || (data.type === 'SINGLE' ? 1 : 100),
        createdById: req.user!.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      }
    });

    res.status(201).json(code);
  } catch (error) {
    next(error);
  }
});

// Get invite codes
router.get('/invite-codes', async (req, res, next) => {
  try {
    const codes = await prisma.inviteCode.findMany({
      include: {
        _count: {
          select: { usedByUsers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(codes);
  } catch (error) {
    next(error);
  }
});


// Toggle user active status
router.patch('/users/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Change user role
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'OWNER', 'MANAGER'].includes(role)) {
      throw new AppError(400, 'Invalid role');
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Не позволяем менять роль последнего админа
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });
      
      if (adminCount === 1) {
        throw new AppError(400, 'Cannot change role of the last admin');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Grant full access to owner
router.patch('/users/:id/grant-access', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.role !== 'OWNER') {
      throw new AppError(400, 'Only owners can be granted full access');
    }

    if (user.hasFullAccess) {
      throw new AppError(400, 'User already has full access');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { hasFullAccess: true },
      include: {
        ownedShop: true,
        managedShop: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Revoke full access from owner
router.patch('/users/:id/revoke-access', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.role !== 'OWNER') {
      throw new AppError(400, 'Only owners can have access revoked');
    }

    if (!user.hasFullAccess) {
      throw new AppError(400, 'User already has limited access');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { hasFullAccess: false },
      include: {
        ownedShop: true,
        managedShop: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Create shop
router.post('/shops', async (req, res, next) => {
  try {
    const data = createShopSchema.parse(req.body);

    // Проверяем, что владелец существует и является OWNER
    const owner = await prisma.user.findUnique({
      where: { id: data.ownerId },
      include: { ownedShop: true }
    });

    if (!owner) {
      throw new AppError(404, 'Owner not found');
    }

    if (owner.role !== 'OWNER') {
      throw new AppError(400, 'User must have OWNER role');
    }

    if (owner.ownedShop) {
      throw new AppError(400, 'Owner already has a shop');
    }

    // Проверяем токен бота
    const testBot = new TelegramBot(data.botToken, { polling: false });
    let botInfo;
    try {
      botInfo = await testBot.getMe();
    } catch (error) {
      throw new AppError(400, 'Invalid bot token');
    }

    // Создаем магазин
    const shop = await prisma.shop.create({
      data: {
        name: data.name,
        botToken: data.botToken,
        botUsername: botInfo.username!,
        category: data.category,
        ownerId: data.ownerId
      },
      include: {
        owner: true,
        _count: {
          select: { dialogs: true }
        }
      }
    });

    // Запускаем бота
    await createBot(shop.id, shop.botToken);

    res.status(201).json(shop);
  } catch (error) {
    next(error);
  }
});

// Update shop
router.patch('/shops/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateShopSchema.parse(req.body);

    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.category) updateData.category = data.category;

    // Если меняем токен бота
    if (data.botToken) {
      const testBot = new TelegramBot(data.botToken, { polling: false });
      let botInfo;
      try {
        botInfo = await testBot.getMe();
      } catch (error) {
        throw new AppError(400, 'Invalid bot token');
      }

      updateData.botToken = data.botToken;
      updateData.botUsername = botInfo.username;

      // Удаляем старого бота и создаем нового
      await removeBot(shop.id);
      await createBot(shop.id, data.botToken);
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        _count: {
          select: { dialogs: true }
        }
      }
    });

    res.json(updatedShop);
  } catch (error) {
    next(error);
  }
});

// Approve shop
router.patch('/shops/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    if (shop.isApproved) {
      throw new AppError(400, 'Shop already approved');
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: { isApproved: true }
    });

    res.json(updatedShop);
  } catch (error) {
    next(error);
  }
});

// Toggle shop status
router.patch('/shops/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    // Если деактивируем - останавливаем бота
    if (!isActive && shop.isActive) {
      await removeBot(shop.id);
    }
    // Если активируем - запускаем бота
    else if (isActive && !shop.isActive) {
      await createBot(shop.id, shop.botToken);
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: { isActive },
      include: {
        owner: true,
        _count: {
          select: { dialogs: true }
        }
      }
    });

    res.json(updatedShop);
  } catch (error) {
    next(error);
  }
});

// Delete shop
router.delete('/shops/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dialogs: true }
        }
      }
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    if (shop._count.dialogs > 0) {
      throw new AppError(400, 'Cannot delete shop with existing dialogs');
    }

    // Останавливаем бота
    await removeBot(shop.id);

    // Удаляем магазин
    await prisma.shop.delete({
      where: { id }
    });

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalShops,
      totalDialogs,
      totalMessages,
      activeShops,
      unapprovedShops
    ] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.dialog.count(),
      prisma.message.count(),
      prisma.shop.count({ where: { isActive: true } }),
      prisma.shop.count({ where: { isApproved: false } })
    ]);

    res.json({
      totalUsers,
      totalShops,
      totalDialogs,
      totalMessages,
      activeShops,
      unapprovedShops
    });
  } catch (error) {
    next(error);
  }
});

// Get all invite codes
router.get('/invite-codes', async (req, res, next) => {
  try {
    const inviteCodes = await prisma.inviteCode.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        },
        usedByUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            telegramId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      inviteCodes: inviteCodes.map(code => ({
        ...code,
        usedBy: code.usedByUsers
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create invite code
router.post('/invite-codes', async (req, res, next) => {
  try {
    const { role, type, maxUses, expiresInDays, comment } = req.body;
    
    // Validation
    if (!['OWNER', 'MANAGER'].includes(role)) {
      throw new AppError(400, 'Invalid role');
    }
    
    if (!['SINGLE', 'MULTI'].includes(type)) {
      throw new AppError(400, 'Invalid type');
    }
    
    const code = generateInviteCode();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        type,
        role,
        maxUses: type === 'SINGLE' ? 1 : maxUses || 10,
        expiresAt,
        comment,
        createdById: req.user!.id,
        isActive: true,
        usedCount: 0
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      inviteCode
    });
  } catch (error) {
    next(error);
  }
});

// Toggle invite code status
router.patch('/invite-codes/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const code = await prisma.inviteCode.findUnique({
      where: { id }
    });
    
    if (!code) {
      throw new AppError(404, 'Invite code not found');
    }
    
    const updatedCode = await prisma.inviteCode.update({
      where: { id },
      data: { isActive: !code.isActive }
    });
    
    res.json({
      success: true,
      inviteCode: updatedCode
    });
  } catch (error) {
    next(error);
  }
});

// Delete invite code
router.delete('/invite-codes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const code = await prisma.inviteCode.findUnique({
      where: { id },
      include: {
        usedByUsers: true
      }
    });
    
    if (!code) {
      throw new AppError(404, 'Invite code not found');
    }
    
    if (code.usedByUsers.length > 0) {
      throw new AppError(400, 'Cannot delete used invite code');
    }
    
    await prisma.inviteCode.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Invite code deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;