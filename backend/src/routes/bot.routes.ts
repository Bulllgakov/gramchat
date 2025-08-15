import { Router } from 'express';
import { z } from 'zod';
import TelegramBot from 'node-telegram-bot-api';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { createBot, removeBot } from '../services/telegram/botManager';
import { normalizeBotUsername, validateBotUsername, validateBotToken } from '../utils/validators';

const router = Router();

const createBotSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1).refine(validateBotToken, {
    message: 'Invalid bot token format'
  }),
  botUsername: z.string().min(1).transform(normalizeBotUsername).refine(validateBotUsername, {
    message: 'Invalid bot username. Must be 5-32 characters, contain only letters, numbers, underscores and end with "bot"'
  }),
  category: z.string().min(1)
});

// Get my bots (for owners and managers)
router.get('/my-bots', authenticate, async (req, res, next) => {
  try {
    let bots;
    
    if (req.user!.role === 'OWNER') {
      // Владелец видит все свои боты
      bots = await prisma.bot.findMany({
        where: { ownerId: req.user!.id },
        include: {
          managers: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true
                }
              }
            }
          },
          _count: {
            select: { dialogs: true }
          }
        }
      });
    } else if (req.user!.role === 'MANAGER') {
      // Менеджер видит только назначенные боты
      const botManagers = await prisma.botManager.findMany({
        where: { userId: req.user!.id },
        include: {
          bot: {
            include: {
              _count: {
                select: { dialogs: true }
              }
            }
          }
        }
      });
      
      bots = botManagers.map(bm => bm.bot);
    } else {
      bots = [];
    }

    res.json(bots);
  } catch (error) {
    next(error);
  }
});

// Get all bots (for admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const bots = await prisma.bot.findMany({
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        _count: {
          select: { 
            dialogs: true,
            managers: true
          }
        }
      }
    });

    res.json(bots);
  } catch (error) {
    next(error);
  }
});

// Create bot (for owners)
router.post('/', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    console.log('Creating bot for owner:', req.user!.id);
    const data = createBotSchema.parse(req.body);

    // Проверяем токен бота перед сохранением
    const testBot = new TelegramBot(data.botToken, { polling: false });
    let botInfo;
    try {
      botInfo = await testBot.getMe();
      console.log('Bot info from Telegram:', botInfo);
    } catch (error: any) {
      console.error('Error validating bot token:', error.message);
      throw new AppError(400, 'Неверный токен бота. Проверьте правильность токена и попробуйте снова.');
    }

    // Проверяем, не используется ли уже такой бот в системе
    const existingBotByToken = await prisma.bot.findFirst({
      where: { botToken: data.botToken }
    });

    if (existingBotByToken) {
      if (existingBotByToken.ownerId === req.user!.id) {
        throw new AppError(400, 'Вы уже подключили этого бота. Перейдите на главную страницу и выберите его из списка.');
      } else {
        throw new AppError(400, 'Этот бот уже подключен другим пользователем. Используйте другого бота.');
      }
    }

    const existingBotByUsername = await prisma.bot.findFirst({
      where: { botUsername: data.botUsername }
    });

    if (existingBotByUsername) {
      if (existingBotByUsername.ownerId === req.user!.id) {
        throw new AppError(400, 'Вы уже подключили бота с таким username. Перейдите на главную страницу и выберите его из списка.');
      } else {
        throw new AppError(400, 'Бот с таким username уже подключен другим пользователем. Проверьте правильность username.');
      }
    }

    const bot = await prisma.bot.create({
      data: {
        ...data,
        ownerId: req.user!.id
      }
    });

    console.log('Bot created in database:', bot.id);

    // Create Telegram bot
    try {
      await createBot(bot.id, bot.botToken);
      console.log('Telegram bot initialized successfully');
    } catch (botError: any) {
      console.error('Error initializing Telegram bot:', botError);
      // Удаляем бота из БД если не удалось инициализировать
      await prisma.bot.delete({ where: { id: bot.id } });
      throw new AppError(500, 'Не удалось инициализировать бота. Проверьте токен и попробуйте снова.');
    }

    res.status(201).json(bot);
  } catch (error: any) {
    console.error('Error creating bot:', error);
    next(error);
  }
});

// Update bot
router.put('/:id', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createBotSchema.partial().parse(req.body);

    const bot = await prisma.bot.findUnique({
      where: { id }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
    }

    if (bot.ownerId !== req.user!.id) {
      throw new AppError(403, 'Forbidden');
    }

    // Проверяем bot token если изменен
    if (data.botToken && data.botToken !== bot.botToken) {
      // Проверяем валидность нового токена
      const testBot = new TelegramBot(data.botToken, { polling: false });
      try {
        await testBot.getMe();
      } catch (error: any) {
        throw new AppError(400, 'Неверный токен бота. Проверьте правильность токена.');
      }

      const existingBotByToken = await prisma.bot.findFirst({
        where: { 
          botToken: data.botToken,
          id: { not: id }
        }
      });

      if (existingBotByToken) {
        throw new AppError(400, 'Этот бот уже подключен. Используйте другого бота.');
      }
    }

    // Проверяем username
    if (data.botUsername && data.botUsername !== bot.botUsername) {
      const existingBotByUsername = await prisma.bot.findFirst({
        where: { 
          botUsername: data.botUsername,
          id: { not: id }
        }
      });

      if (existingBotByUsername) {
        throw new AppError(400, 'Бот с таким username уже зарегистрирован в системе.');
      }
    }

    const updatedBot = await prisma.bot.update({
      where: { id },
      data
    });

    // Update bot if token changed
    if (data.botToken && data.botToken !== bot.botToken) {
      await removeBot(id);
      await createBot(id, data.botToken);
    }

    res.json(updatedBot);
  } catch (error) {
    next(error);
  }
});

// Delete bot
router.delete('/:id', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findUnique({
      where: { id }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
    }

    if (bot.ownerId !== req.user!.id) {
      throw new AppError(403, 'Forbidden');
    }

    // Remove bot from Telegram
    await removeBot(id);

    // Delete bot and all related data
    await prisma.bot.delete({
      where: { id }
    });

    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Toggle bot active status
router.patch('/:id/toggle', authenticate, authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findUnique({
      where: { id }
    });

    if (!bot) {
      throw new AppError(404, 'Bot not found');
    }

    if (req.user!.role === 'OWNER' && bot.ownerId !== req.user!.id) {
      throw new AppError(403, 'Forbidden');
    }

    const updatedBot = await prisma.bot.update({
      where: { id },
      data: { isActive: !bot.isActive }
    });

    if (updatedBot.isActive) {
      await createBot(id, bot.botToken);
    } else {
      await removeBot(id);
    }

    res.json(updatedBot);
  } catch (error) {
    next(error);
  }
});

// Approve bot (admin only)
router.patch('/:id/approve', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.update({
      where: { id },
      data: { isApproved: true }
    });

    res.json(bot);
  } catch (error) {
    next(error);
  }
});

export default router;