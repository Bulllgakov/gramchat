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


const createBotSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1),
  category: z.enum(['RETAIL', 'SERVICES', 'FOOD', 'ELECTRONICS', 'FASHION', 'HEALTH', 'OTHER']),
  ownerId: z.string()
});

const updateBotSchema = z.object({
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
        ownedBots: {
          include: {
            _count: {
              select: {
                dialogs: true,
                managers: true
              }
            }
          }
        },
        managedBots: {
          include: {
            bot: {
              include: {
                owner: {
                  select: {
                    firstName: true,
                    lastName: true,
                    username: true
                  }
                }
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
        ownedBots: {
          include: {
            _count: {
              select: {
                dialogs: true,
                managers: true
              }
            }
          }
        },
        managedBots: {
          include: {
            bot: true
          }
        },
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

// Get all bots
router.get('/bots', async (req, res, next) => {
  try {
    const { isActive, category, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (category) where.category = category;

    const bots = await prisma.bot.findMany({
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

    const total = await prisma.bot.count({ where });

    res.json({
      bots,
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
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
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
        ownedBots: true,
        managedBots: {
          include: {
            bot: true
          }
        }
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
        ownedBots: true,
        managedBots: {
          include: {
            bot: true
          }
        }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Create bot for owner
router.post('/bots', async (req, res, next) => {
  try {
    const data = createBotSchema.parse(req.body);

    // Проверяем, что владелец существует и является OWNER
    const owner = await prisma.user.findUnique({
      where: { id: data.ownerId }
    });

    if (!owner) {
      throw new AppError(404, 'Owner not found');
    }

    if (owner.role !== 'OWNER') {
      throw new AppError(400, 'User must have OWNER role');
    }

    // Проверяем токен бота
    const testBot = new TelegramBot(data.botToken, { polling: false });
    let botInfo;
    try {
      botInfo = await testBot.getMe();
    } catch (error) {
      throw new AppError(400, 'Invalid bot token');
    }

    // Проверяем, не используется ли уже такой бот
    const existingBot = await prisma.bot.findFirst({
      where: { 
        OR: [
          { botToken: data.botToken },
          { botUsername: botInfo.username! }
        ]
      }
    });

    if (existingBot) {
      throw new AppError(400, 'Bot already exists in the system');
    }

    // Создаем бот
    const bot = await prisma.bot.create({
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
    await createBot(bot.id, bot.botToken);

    res.status(201).json(bot);
  } catch (error) {
    next(error);
  }
});

// Update bot
router.patch('/bots/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateBotSchema.parse(req.body);

    const bot = await prisma.bot.findUnique({
      where: { id }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
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
      await removeBot(bot.id);
      await createBot(bot.id, data.botToken);
    }

    const updatedBot = await prisma.bot.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        _count: {
          select: { dialogs: true }
        }
      }
    });

    res.json(updatedBot);
  } catch (error) {
    next(error);
  }
});

// Approve bot
router.patch('/bots/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findUnique({
      where: { id }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
    }

    if (bot.isApproved) {
      throw new AppError(400, 'Bot already approved');
    }

    const updatedBot = await prisma.bot.update({
      where: { id },
      data: { isApproved: true }
    });

    res.json(updatedBot);
  } catch (error) {
    next(error);
  }
});

// Toggle bot status
router.patch('/bots/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const bot = await prisma.bot.findUnique({
      where: { id }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
    }

    // Если деактивируем - останавливаем бота
    if (!isActive && bot.isActive) {
      await removeBot(bot.id);
    }
    // Если активируем - запускаем бота
    else if (isActive && !bot.isActive) {
      await createBot(bot.id, bot.botToken);
    }

    const updatedBot = await prisma.bot.update({
      where: { id },
      data: { isActive },
      include: {
        owner: true,
        _count: {
          select: { dialogs: true }
        }
      }
    });

    res.json(updatedBot);
  } catch (error) {
    next(error);
  }
});

// Delete bot
router.delete('/bots/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dialogs: true }
        }
      }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
    }

    if (bot._count.dialogs > 0) {
      throw new AppError(400, 'Cannot delete bot with existing dialogs');
    }

    // Останавливаем бота
    await removeBot(bot.id);

    // Удаляем бот
    await prisma.bot.delete({
      where: { id }
    });

    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBots,
      totalDialogs,
      totalMessages,
      activeBots,
      unapprovedBots
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bot.count(),
      prisma.dialog.count(),
      prisma.message.count(),
      prisma.bot.count({ where: { isActive: true } }),
      prisma.bot.count({ where: { isApproved: false } })
    ]);

    res.json({
      totalUsers,
      totalBots,
      totalDialogs,
      totalMessages,
      activeBots,
      unapprovedBots
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