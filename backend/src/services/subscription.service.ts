import { PlanType, PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Конфигурация тарифов
export const PLAN_CONFIG = {
  FREE: {
    name: 'FREE',
    telegramBots: 1,
    maxBots: 1,
    dialogsLimit: 100,
    managersLimit: 1,
    pricePerBot: 0,
    features: [
      '1 Telegram бот',
      '1 MAX бот',
      '100 диалогов в месяц',
      '1 руководитель',
      '1 менеджер'
    ]
  },
  PRO: {
    name: 'PRO',
    telegramBots: 0, // Безлимит
    maxBots: 0, // Безлимит
    dialogsLimit: 500,
    managersLimit: 0, // Безлимит
    pricePerBot: 990,
    features: [
      'Безлимит ботов',
      '500 диалогов на бота',
      'Безлимит сотрудников',
      'Приоритетная поддержка',
      '14 дней бесплатно'
    ]
  },
  MAX: {
    name: 'MAX',
    telegramBots: 0, // Безлимит
    maxBots: 0, // Безлимит
    dialogsLimit: 0, // Безлимит
    managersLimit: 0, // Безлимит
    pricePerBot: 3000,
    features: [
      'Безлимит ботов',
      'Безлимит диалогов',
      'Безлимит сотрудников',
      'Премиум поддержка',
      'API доступ'
    ]
  }
};

export class SubscriptionService {
  /**
   * Создает подписку для нового пользователя
   */
  static async createSubscription(userId: string, planType: PlanType = 'FREE', withTrial: boolean = false) {
    try {
      const config = PLAN_CONFIG[planType];
      
      // Если это PRO с триалом, устанавливаем дату окончания через 14 дней
      const trialEndsAt = withTrial && planType === 'PRO' 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
        : null;

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planType,
          telegramBotsLimit: config.telegramBots,
          maxBotsLimit: config.maxBots,
          telegramBotsUsed: 0,
          maxBotsUsed: 0,
          dialogsLimit: config.dialogsLimit,
          dialogsUsed: 0,
          managersLimit: config.managersLimit,
          pricePerBot: config.pricePerBot,
          totalPrice: 0, // Будет рассчитываться при добавлении ботов
          isTrial: withTrial,
          trialEndsAt,
          billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
          isActive: true
        }
      });

      logger.info(`Subscription created for user ${userId} with plan ${planType}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Проверяет лимиты подписки
   */
  static async checkLimits(userId: string, limitType: 'bots' | 'dialogs' | 'managers') {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              ownedBots: true,
              managedBots: true
            }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      switch (limitType) {
        case 'bots':
          const currentBots = subscription.user.ownedBots.length;
          const maxBots = subscription.telegramBotsLimit + subscription.maxBotsLimit;
          return {
            allowed: maxBots === 0 || currentBots < maxBots,
            current: currentBots,
            limit: maxBots,
            unlimited: maxBots === 0
          };

        case 'dialogs':
          return {
            allowed: subscription.dialogsLimit === 0 || subscription.dialogsUsed < subscription.dialogsLimit,
            current: subscription.dialogsUsed,
            limit: subscription.dialogsLimit,
            unlimited: subscription.dialogsLimit === 0
          };

        case 'managers':
          const currentManagers = subscription.user.managedBots.length;
          return {
            allowed: subscription.managersLimit === 0 || currentManagers < subscription.managersLimit,
            current: currentManagers,
            limit: subscription.managersLimit,
            unlimited: subscription.managersLimit === 0
          };

        default:
          throw new Error('Invalid limit type');
      }
    } catch (error) {
      logger.error('Error checking limits:', error);
      throw error;
    }
  }

  /**
   * Обновляет счетчик использованных диалогов
   */
  static async incrementDialogsCount(userId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Проверяем, не превышен ли лимит
      if (subscription.dialogsLimit > 0 && subscription.dialogsUsed >= subscription.dialogsLimit) {
        throw new Error('Dialogs limit exceeded');
      }

      // Увеличиваем счетчик
      await prisma.subscription.update({
        where: { userId },
        data: {
          dialogsUsed: subscription.dialogsUsed + 1
        }
      });

      // Обновляем историю использования
      const month = new Date();
      month.setDate(1);
      month.setHours(0, 0, 0, 0);

      await prisma.usageHistory.upsert({
        where: {
          subscriptionId_month: {
            subscriptionId: subscription.id,
            month
          }
        },
        update: {
          dialogsCount: { increment: 1 }
        },
        create: {
          subscriptionId: subscription.id,
          month,
          dialogsCount: 1
        }
      });

      logger.info(`Dialog count incremented for user ${userId}`);
    } catch (error) {
      logger.error('Error incrementing dialogs count:', error);
      throw error;
    }
  }

  /**
   * Сбрасывает счетчики в начале нового месяца
   */
  static async resetMonthlyCounters() {
    try {
      await prisma.subscription.updateMany({
        data: {
          dialogsUsed: 0
        }
      });

      logger.info('Monthly counters reset completed');
    } catch (error) {
      logger.error('Error resetting monthly counters:', error);
      throw error;
    }
  }

  /**
   * Обновляет план подписки
   */
  static async updatePlan(userId: string, newPlan: PlanType) {
    try {
      const config = PLAN_CONFIG[newPlan];
      
      const subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          planType: newPlan,
          telegramBotsLimit: config.telegramBots,
          maxBotsLimit: config.maxBots,
          dialogsLimit: config.dialogsLimit,
          managersLimit: config.managersLimit,
          pricePerBot: config.pricePerBot,
          isTrial: false, // Отключаем триал при смене плана
          updatedAt: new Date()
        }
      });

      logger.info(`Subscription plan updated for user ${userId} to ${newPlan}`);
      return subscription;
    } catch (error) {
      logger.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  /**
   * Рассчитывает стоимость подписки
   */
  static async calculatePrice(userId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              ownedBots: true
            }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Для FREE тарифа цена всегда 0
      if (subscription.planType === 'FREE') {
        return 0;
      }

      // Количество ботов * цена за бота
      const botsCount = subscription.user.ownedBots.length;
      const totalPrice = botsCount * subscription.pricePerBot;

      // Обновляем общую стоимость
      await prisma.subscription.update({
        where: { userId },
        data: { totalPrice }
      });

      return totalPrice;
    } catch (error) {
      logger.error('Error calculating price:', error);
      throw error;
    }
  }
}