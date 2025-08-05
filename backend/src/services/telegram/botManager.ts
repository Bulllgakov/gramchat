import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { handleMessage } from './messageHandler';
import { config } from '../../config';

const bots = new Map<string, TelegramBot>();

export async function setupTelegramBots() {
  try {
    const shops = await prisma.shop.findMany({
      where: { isActive: true }
    });

    for (const shop of shops) {
      await createBot(shop.id, shop.botToken);
    }

    logger.info(`Initialized ${bots.size} Telegram bots`);
  } catch (error) {
    logger.error('Failed to setup Telegram bots:', error);
  }
}

export async function createBot(shopId: string, botToken: string) {
  try {
    const bot = new TelegramBot(botToken, {
      polling: config.NODE_ENV !== 'production',
      webHook: config.NODE_ENV === 'production'
    });

    if (config.NODE_ENV === 'production' && config.TELEGRAM_WEBHOOK_DOMAIN) {
      const webhookUrl = `${config.TELEGRAM_WEBHOOK_DOMAIN}/api/telegram/webhook/${shopId}`;
      await bot.setWebHook(webhookUrl);
    }

    bot.on('message', async (msg) => {
      await handleMessage(shopId, bot, msg, botToken);
    });

    bot.on('error', (error) => {
      logger.error(`Bot error for shop ${shopId}:`, error);
    });

    bots.set(shopId, bot);
    logger.info(`Bot created for shop ${shopId}`);

    return bot;
  } catch (error) {
    logger.error(`Failed to create bot for shop ${shopId}:`, error);
    throw error;
  }
}

export function getBot(shopId: string): TelegramBot | undefined {
  return bots.get(shopId);
}

export async function removeBot(shopId: string) {
  const bot = bots.get(shopId);
  if (bot) {
    await bot.stopPolling();
    bots.delete(shopId);
    logger.info(`Bot removed for shop ${shopId}`);
  }
}