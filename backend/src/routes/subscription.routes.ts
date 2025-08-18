import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { generateInvoicePDF } from '../services/pdf.service';

const router = Router();

// Конфигурация тарифов
const PLAN_PRICING = {
  PRO: {
    price: 990, // Одинаковая цена для всех типов ботов
    name: 'PRO',
    features: [
      'Безлимит диалогов',
      'Приоритетная поддержка',
      'Статистика и аналитика',
      'API доступ'
    ]
  },
  MAX: {
    price: 3000, // Одинаковая цена для всех типов ботов
    name: 'MAX',
    features: [
      'Всё из PRO',
      'Премиум поддержка 24/7',
      'Персональный менеджер',
      'Кастомизация интерфейса',
      'Приоритетная обработка'
    ]
  }
};

// Скидки по периодам
const PERIOD_DISCOUNTS = {
  1: 0,     // Без скидки
  6: 15,    // 15% скидка
  12: 25    // 25% скидка
};

// Получить подписки текущего пользователя
router.get('/my-subscriptions', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const bots = await prisma.bot.findMany({
      where: { 
        ownerId: req.user!.id,
        isApproved: true
      },
      include: {
        botSubscription: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    // Автоматически создаем подписки FREE для ботов без подписки
    for (const bot of bots) {
      if (!bot.botSubscription) {
        // Определяем тип бота (первый Telegram и первый MAX получают FREE)
        const existingTelegramBots = await prisma.botSubscription.count({
          where: {
            bot: { ownerId: req.user!.id },
            botType: 'TELEGRAM',
            planType: 'FREE'
          }
        });

        const existingMaxBots = await prisma.botSubscription.count({
          where: {
            bot: { ownerId: req.user!.id },
            botType: 'MAX',
            planType: 'FREE'
          }
        });

        const botType = bot.category === 'MAX' ? 'MAX' : 'TELEGRAM';
        const canHaveFree = (botType === 'TELEGRAM' && existingTelegramBots === 0) ||
                           (botType === 'MAX' && existingMaxBots === 0);

        if (canHaveFree) {
          await prisma.botSubscription.create({
            data: {
              botId: bot.id,
              botType,
              planType: 'FREE',
              billingPeriod: 0, // Бессрочно для FREE
              discount: 0,
              basePrice: 0,
              finalPrice: 0,
              isActive: true,
              autoRenew: false
            }
          });
        }
      }
    }

    // Повторно загружаем боты с подписками
    const botsWithSubscriptions = await prisma.bot.findMany({
      where: { 
        ownerId: req.user!.id,
        isApproved: true
      },
      include: {
        botSubscription: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        _count: {
          select: { dialogs: true }
        }
      }
    });

    res.json(botsWithSubscriptions);
  } catch (error) {
    next(error);
  }
});

// Расчет стоимости подписки
router.post('/calculate', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const schema = z.object({
      planType: z.enum(['PRO', 'MAX']),
      botType: z.enum(['TELEGRAM', 'MAX']),
      billingPeriod: z.number().int().refine(val => [1, 6, 12].includes(val))
    });

    const { planType, botType, billingPeriod } = schema.parse(req.body);

    const basePrice = PLAN_PRICING[planType].price; // Используем единую цену
    const discount = PERIOD_DISCOUNTS[billingPeriod];
    const monthlyTotal = basePrice * billingPeriod;
    const discountAmount = Math.round(monthlyTotal * discount / 100);
    const finalPrice = monthlyTotal - discountAmount;

    res.json({
      planType,
      botType,
      billingPeriod,
      basePrice,
      monthlyTotal,
      discount,
      discountAmount,
      finalPrice,
      features: PLAN_PRICING[planType].features
    });
  } catch (error) {
    next(error);
  }
});

// Создать новую подписку
router.post('/create', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const schema = z.object({
      botId: z.string().uuid(),
      planType: z.enum(['PRO', 'MAX']),
      billingPeriod: z.number().int().refine(val => [1, 6, 12].includes(val)),
      paymentMethod: z.enum(['CARD', 'INVOICE'])
    });

    const { botId, planType, billingPeriod, paymentMethod } = schema.parse(req.body);

    // Проверяем, что бот принадлежит пользователю
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { botSubscription: true }
    });

    if (!bot || bot.ownerId !== req.user!.id) {
      throw new AppError(404, 'Бот не найден');
    }

    if (bot.botSubscription && bot.botSubscription.planType !== 'FREE') {
      throw new AppError(400, 'У этого бота уже есть активная подписка');
    }

    // Определяем тип бота
    const botType = bot.category === 'MAX' ? 'MAX' : 'TELEGRAM';

    // Рассчитываем стоимость
    const basePrice = PLAN_PRICING[planType].price; // Используем единую цену
    const discount = PERIOD_DISCOUNTS[billingPeriod];
    const monthlyTotal = basePrice * billingPeriod;
    const discountAmount = Math.round(monthlyTotal * discount / 100);
    const finalPrice = monthlyTotal - discountAmount;

    // Обновляем или создаем подписку
    const subscription = await prisma.botSubscription.upsert({
      where: { botId },
      update: {
        planType,
        billingPeriod,
        discount,
        basePrice,
        finalPrice,
        endDate: new Date(Date.now() + billingPeriod * 30 * 24 * 60 * 60 * 1000),
        isActive: paymentMethod === 'CARD', // Активируем сразу для оплаты картой
        autoRenew: true
      },
      create: {
        botId,
        botType,
        planType,
        billingPeriod,
        discount,
        basePrice,
        finalPrice,
        endDate: new Date(Date.now() + billingPeriod * 30 * 24 * 60 * 60 * 1000),
        isActive: paymentMethod === 'CARD', // Активируем сразу для оплаты картой
        autoRenew: true
      }
    });

    // Создаем платеж
    const payment = await prisma.botPayment.create({
      data: {
        botSubscriptionId: subscription.id,
        amount: finalPrice,
        paymentMethod,
        paymentStatus: paymentMethod === 'CARD' ? 'PENDING' : 'PENDING',
        invoiceNumber: paymentMethod === 'INVOICE' ? 
          `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null
      }
    });

    // Если оплата по счету, генерируем PDF
    if (paymentMethod === 'INVOICE') {
      const invoiceUrl = await generateInvoicePDF({
        payment,
        subscription,
        bot,
        user: req.user!
      });

      await prisma.botPayment.update({
        where: { id: payment.id },
        data: { invoiceUrl }
      });

      payment.invoiceUrl = invoiceUrl;
    }

    res.json({
      subscription,
      payment,
      paymentUrl: paymentMethod === 'CARD' ? 
        `/api/payments/process/${payment.id}` : 
        payment.invoiceUrl
    });
  } catch (error) {
    next(error);
  }
});

// Отменить подписку
router.post('/:subscriptionId/cancel', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.botSubscription.findUnique({
      where: { id: subscriptionId },
      include: { bot: true }
    });

    if (!subscription || subscription.bot.ownerId !== req.user!.id) {
      throw new AppError(404, 'Подписка не найдена');
    }

    if (subscription.planType === 'FREE') {
      throw new AppError(400, 'Нельзя отменить бесплатную подписку');
    }

    await prisma.botSubscription.update({
      where: { id: subscriptionId },
      data: {
        autoRenew: false,
        isActive: false
      }
    });

    res.json({ message: 'Подписка отменена' });
  } catch (error) {
    next(error);
  }
});

// Получить счет для скачивания
router.get('/invoice/:paymentId', authenticate, authorize('OWNER'), async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.botPayment.findUnique({
      where: { id: paymentId },
      include: {
        botSubscription: {
          include: {
            bot: true
          }
        }
      }
    });

    if (!payment || payment.botSubscription.bot.ownerId !== req.user!.id) {
      throw new AppError(404, 'Счет не найден');
    }

    if (!payment.invoiceUrl) {
      throw new AppError(404, 'PDF счет не найден');
    }

    res.json({ invoiceUrl: payment.invoiceUrl });
  } catch (error) {
    next(error);
  }
});

export default router;