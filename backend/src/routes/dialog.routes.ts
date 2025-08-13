import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { canSendMessages } from '../middleware/ownerAccess';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { getBot } from '../services/telegram/botManager';
import axios from 'axios';
import { logger } from '../utils/logger';
import { messageLimiter } from '../middleware/rateLimiter';

const router = Router();

const sendMessageSchema = z.object({
  text: z.string().min(1)
});

// Get dialogs for bots
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20', filter = 'all', botId } = req.query;

    let botIds: string[] = [];
    
    if (req.user!.role === 'OWNER') {
      // Owner sees dialogs from all their bots
      const bots = await prisma.bot.findMany({
        where: { ownerId: req.user!.id },
        select: { id: true }
      });
      botIds = bots.map(b => b.id);
    } else if (req.user!.role === 'MANAGER') {
      // Manager sees dialogs from assigned bots
      const botManagers = await prisma.botManager.findMany({
        where: { userId: req.user!.id },
        select: { botId: true }
      });
      botIds = botManagers.map(bm => bm.botId);
    } else if (req.user!.role === 'ADMIN') {
      // Admin sees all dialogs
      if (botId) {
        botIds = [botId as string];
      } else {
        const bots = await prisma.bot.findMany({ select: { id: true } });
        botIds = bots.map(b => b.id);
      }
    }

    if (botIds.length === 0) {
      throw new AppError(403, 'No bot access');
    }

    // If specific botId is provided, filter to that bot
    const where: any = botId ? { botId } : { botId: { in: botIds } };
    if (status) {
      where.status = status;
    }
    
    // Фильтр по назначению
    if (filter === 'my') {
      where.assignedToId = req.user!.id;
      // Для "Мои" - не показываем закрытые
      if (!status) {
        where.status = { not: 'CLOSED' };
      }
    } else if (filter === 'unassigned') {
      where.assignedToId = null;
      // Для "Свободные" - не показываем закрытые
      if (!status) {
        where.status = { not: 'CLOSED' };
      }
    } else if (filter === 'all') {
      // Для владельцев - видят все диалоги включая закрытые
      if (req.user?.role === 'OWNER' || req.user?.role === 'ADMIN') {
        // Владельцы и админы видят все диалоги
      } else {
        // Менеджеры видят только свои и свободные диалоги (без закрытых)
        where.OR = [
          { assignedToId: req.user!.id },
          { assignedToId: null }
        ];
        if (!status) {
          where.status = { not: 'CLOSED' };
        }
      }
    }

    const dialogs = await prisma.dialog.findMany({
      where,
      select: {
        id: true,
        telegramChatId: true,
        customerName: true,
        customerUsername: true,
        customerPhotoUrl: true,
        status: true,
        closeReason: true,
        createdAt: true,
        lastMessageAt: true,
        assignedToId: true,
        assignedAt: true,
        closedAt: true,
        botId: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

    const total = await prisma.dialog.count({ where });

    res.json({
      dialogs,
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

// Get dialog messages
router.get('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      include: { bot: true }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Check if user has access to this bot
    const hasAccess = req.user!.role === 'ADMIN' || 
      dialog.bot.ownerId === req.user!.id ||
      await prisma.botManager.findFirst({
        where: {
          botId: dialog.botId,
          userId: req.user!.id
        }
      });

    if (!hasAccess) {
      throw new AppError(403, 'Access denied');
    }

    const messages = await prisma.message.findMany({
      where: { dialogId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

    // Include dialog details for avatar updates
    const dialogDetails = await prisma.dialog.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        customerUsername: true,
        customerPhotoUrl: true,
        status: true
      }
    });

    res.json({ 
      messages: messages.reverse(),
      dialog: dialogDetails 
    });
  } catch (error) {
    next(error);
  }
});

// Send message to dialog
router.post('/:id/messages', authenticate, canSendMessages, messageLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = sendMessageSchema.parse(req.body);

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      include: { bot: true }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Check if user has access to this bot
    const hasAccess = req.user!.role === 'ADMIN' || 
      dialog.bot.ownerId === req.user!.id ||
      await prisma.botManager.findFirst({
        where: {
          botId: dialog.botId,
          userId: req.user!.id
        }
      });

    if (!hasAccess) {
      throw new AppError(403, 'Access denied');
    }

    // Определяем, является ли пользователь владельцем
    const isOwner = req.user?.role === 'OWNER';

    // Send message via Telegram bot
    const bot = getBot(dialog.botId);
    if (!bot) {
      throw new AppError(500, 'Bot not available');
    }

    // Добавляем префикс для сообщений от владельца в чужих диалогах
    let messageText = text;
    if (isOwner && dialog.assignedToId && dialog.assignedToId !== req.user!.id) {
      messageText = `👤 [Владелец магазина]: ${text}`;
    }

    const sentMessage = await bot.sendMessage(Number(dialog.telegramChatId), messageText);

    // Save message
    const message = await prisma.message.create({
      data: {
        dialogId: id,
        text,
        fromUser: false,
        messageType: 'TEXT',
        telegramId: BigInt(sentMessage.message_id)
      }
    });

    // Update dialog and assign to current user if not assigned
    const updateData: any = { 
      lastMessageAt: new Date(),
      status: 'ACTIVE'
    };
    
    // Автоматически захватываем диалог при первом ответе
    // НО: Владелец не захватывает уже назначенные диалоги
    
    if (!dialog.assignedToId) {
      // Диалог свободен - захватываем
      updateData.assignedToId = req.user!.id;
      updateData.assignedAt = new Date();
      
      // Записываем действие "Взял себе"
      await prisma.dialogAction.create({
        data: {
          dialogId: dialog.id,
          userId: req.user!.id,
          action: 'ASSIGNED'
        }
      });
    } else if (dialog.assignedToId !== req.user!.id && !isOwner) {
      // Диалог захвачен другим, и это не владелец - блокируем
      throw new AppError(403, 'Dialog is assigned to another manager');
    }
    // Если владелец отвечает в чужой диалог - просто отправляем сообщение без захвата
    
    await prisma.dialog.update({
      where: { id },
      data: updateData
    });

    res.json(message);
  } catch (error) {
    next(error);
  }
});

// Update dialog status
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, closeReason } = req.body;

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      include: { bot: true }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Check if user has access to this bot
    const hasAccess = req.user!.role === 'ADMIN' || 
      dialog.bot.ownerId === req.user!.id ||
      await prisma.botManager.findFirst({
        where: {
          botId: dialog.botId,
          userId: req.user!.id
        }
      });

    if (!hasAccess) {
      throw new AppError(403, 'Access denied');
    }

    const updateData: any = { status };
    
    // Если закрываем диалог - сохраняем причину и время
    if (status === 'CLOSED' && closeReason) {
      updateData.closeReason = closeReason;
      updateData.closedAt = new Date();
    } else if (status !== 'CLOSED') {
      // Если открываем диалог - очищаем причину закрытия
      updateData.closeReason = null;
      updateData.closedAt = null;
    }

    const updatedDialog = await prisma.dialog.update({
      where: { id },
      data: updateData
    });

    res.json(updatedDialog);
  } catch (error) {
    next(error);
  }
});

// Claim dialog (захватить диалог)
router.post('/:id/claim', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      include: { bot: true }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Check if user has access to this bot
    const hasAccess = req.user!.role === 'ADMIN' || 
      dialog.bot.ownerId === req.user!.id ||
      await prisma.botManager.findFirst({
        where: {
          botId: dialog.botId,
          userId: req.user!.id
        }
      });

    if (!hasAccess) {
      throw new AppError(403, 'Access denied');
    }

    if (dialog.assignedToId && dialog.assignedToId !== req.user!.id) {
      throw new AppError(400, 'Dialog already assigned to another manager');
    }

    const updatedDialog = await prisma.dialog.update({
      where: { id },
      data: {
        assignedToId: req.user!.id,
        assignedAt: new Date()
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    // Записываем действие "Взял себе"
    await prisma.dialogAction.create({
      data: {
        dialogId: dialog.id,
        userId: req.user!.id,
        action: 'ASSIGNED'
      }
    });

    res.json(updatedDialog);
  } catch (error) {
    next(error);
  }
});

// Release dialog (освободить диалог)
router.post('/:id/release', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      include: { bot: true }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Только назначенный менеджер или владелец могут освободить диалог
    if (dialog.assignedToId !== req.user!.id && dialog.bot.ownerId !== req.user!.id) {
      throw new AppError(403, 'Only assigned manager or owner can release dialog');
    }

    const updatedDialog = await prisma.dialog.update({
      where: { id },
      data: {
        assignedToId: null,
        assignedAt: null
      }
    });
    
    // Записываем действие "Освободил"
    await prisma.dialogAction.create({
      data: {
        dialogId: dialog.id,
        userId: req.user!.id,
        action: 'RELEASED'
      }
    });

    res.json(updatedDialog);
  } catch (error) {
    next(error);
  }
});

// Transfer dialog (передать диалог другому менеджеру)
router.post('/:id/transfer', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    if (!managerId) {
      throw new AppError(400, 'Manager ID is required');
    }

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      include: { bot: true }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Только владелец может передавать диалоги
    if (dialog.bot.ownerId !== req.user!.id) {
      throw new AppError(403, 'Only bot owner can transfer dialogs');
    }

    // Проверяем, что менеджер существует и имеет доступ к этому боту
    const managerAccess = await prisma.botManager.findFirst({
      where: {
        userId: managerId,
        botId: dialog.botId
      },
      include: {
        user: {
          select: { isActive: true }
        }
      }
    });

    if (!managerAccess || !managerAccess.user.isActive) {
      throw new AppError(404, 'Manager not found or not active for this bot');
    }

    const updatedDialog = await prisma.dialog.update({
      where: { id },
      data: {
        assignedToId: managerId,
        assignedAt: new Date()
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    // Записываем действие "Передал"
    await prisma.dialogAction.create({
      data: {
        dialogId: dialog.id,
        userId: req.user!.id,
        action: 'TRANSFERRED',
        targetUserId: managerId
      }
    });

    res.json(updatedDialog);
  } catch (error) {
    next(error);
  }
});

// Get customer avatar
router.get('/:id/avatar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    
    logger.info(`Avatar request for dialog ${id}, token: ${token ? 'provided' : 'missing'}`);

    // Verify token from query parameter
    if (!token || typeof token !== 'string') {
      throw new AppError(401, 'Authentication required');
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      throw new AppError(401, 'Invalid token');
    }

    const dialog = await prisma.dialog.findUnique({
      where: { id },
      select: { 
        customerPhotoUrl: true,
        botId: true,
        bot: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!dialog) {
      throw new AppError(404, 'Dialog not found');
    }

    // Check if user has access to this bot's dialogs
    const hasAccess = await (async () => {
      if (dialog.bot.ownerId === userId) return true;
      
      const managerAccess = await prisma.botManager.findFirst({
        where: {
          userId: userId,
          botId: dialog.botId
        }
      });
      
      return !!managerAccess;
    })();

    logger.info(`Avatar access check - userId: ${userId}, ownerId: ${dialog.bot.ownerId}, botId: ${dialog.botId}, hasAccess: ${hasAccess}`);

    if (!hasAccess) {
      throw new AppError(403, 'Access denied');
    }

    if (!dialog.customerPhotoUrl) {
      throw new AppError(404, 'No avatar available');
    }

    // If it's a Telegram URL, fetch and return as base64
    if (dialog.customerPhotoUrl.startsWith('https://api.telegram.org/')) {
      try {
        const response = await axios.get(dialog.customerPhotoUrl, {
          responseType: 'arraybuffer'
        });
        
        const buffer = Buffer.from(response.data);
        const base64 = buffer.toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        res.json({ avatarUrl: dataUrl });
      } catch (fetchError) {
        logger.error('Failed to fetch avatar from Telegram', fetchError);
        throw new AppError(500, 'Failed to fetch avatar');
      }
    } else {
      // If it's already a data URL, return it
      res.json({ avatarUrl: dialog.customerPhotoUrl });
    }
  } catch (error) {
    next(error);
  }
});

export default router;