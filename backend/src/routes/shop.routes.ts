import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { createBot, removeBot } from '../services/telegram/botManager';
import { normalizeBotUsername, validateBotUsername, validateBotToken } from '../utils/validators';

const router = Router();

const createShopSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1).refine(validateBotToken, {
    message: 'Invalid bot token format'
  }),
  botUsername: z.string().min(1).transform(normalizeBotUsername).refine(validateBotUsername, {
    message: 'Invalid bot username. Must be 5-32 characters, contain only letters, numbers, underscores and end with "bot"'
  }),
  category: z.string().min(1)
});

// Get my shop (for owners)
router.get('/my-shop', authenticate, async (req, res, next) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user!.id },
      include: {
        managers: true,
        _count: {
          select: { dialogs: true }
        }
      }
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    res.json(shop);
  } catch (error) {
    next(error);
  }
});

// Create shop (for owners)
router.post('/', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const data = createShopSchema.parse(req.body);

    const existingShop = await prisma.shop.findUnique({
      where: { ownerId: req.user!.id }
    });

    if (existingShop) {
      throw new AppError(400, 'You already have a shop');
    }

    // Проверяем, не используется ли уже такой бот в системе
    const existingBotByToken = await prisma.shop.findFirst({
      where: { botToken: data.botToken }
    });

    if (existingBotByToken) {
      throw new AppError(400, 'Этот бот уже подключен к другому магазину. Обратитесь к владельцу бота или используйте другого бота.');
    }

    const existingBotByUsername = await prisma.shop.findFirst({
      where: { botUsername: data.botUsername }
    });

    if (existingBotByUsername) {
      throw new AppError(400, 'Бот с таким username уже зарегистрирован в системе. Проверьте правильность username или используйте другого бота.');
    }

    const shop = await prisma.shop.create({
      data: {
        ...data,
        ownerId: req.user!.id
      }
    });

    // Create Telegram bot
    await createBot(shop.id, shop.botToken);

    res.status(201).json(shop);
  } catch (error) {
    next(error);
  }
});

// Update shop
router.put('/:id', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createShopSchema.partial().parse(req.body);

    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop || shop.ownerId !== req.user!.id) {
      throw new AppError(404, 'Shop not found');
    }

    // Проверяем, не используется ли новый токен другим магазином
    if (data.botToken && data.botToken !== shop.botToken) {
      const existingBotByToken = await prisma.shop.findFirst({
        where: { 
          botToken: data.botToken,
          id: { not: id }
        }
      });

      if (existingBotByToken) {
        throw new AppError(400, 'Этот бот уже подключен к другому магазину. Используйте другого бота.');
      }
    }

    // Проверяем username
    if (data.botUsername && data.botUsername !== shop.botUsername) {
      const existingBotByUsername = await prisma.shop.findFirst({
        where: { 
          botUsername: data.botUsername,
          id: { not: id }
        }
      });

      if (existingBotByUsername) {
        throw new AppError(400, 'Бот с таким username уже зарегистрирован в системе.');
      }
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data
    });

    // Update bot if token changed
    if (data.botToken && data.botToken !== shop.botToken) {
      await removeBot(id);
      await createBot(id, data.botToken);
    }

    res.json(updatedShop);
  } catch (error) {
    next(error);
  }
});

// Toggle shop active status
router.patch('/:id/toggle', authenticate, authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    if (req.user!.role === 'OWNER' && shop.ownerId !== req.user!.id) {
      throw new AppError(403, 'Forbidden');
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: { isActive: !shop.isActive }
    });

    if (updatedShop.isActive) {
      await createBot(id, shop.botToken);
    } else {
      await removeBot(id);
    }

    res.json(updatedShop);
  } catch (error) {
    next(error);
  }
});

// Add manager to shop
router.post('/:id/managers', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop || shop.ownerId !== req.user!.id) {
      throw new AppError(404, 'Shop not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { managedShopId: id }
    });

    res.json({ message: 'Manager added successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;