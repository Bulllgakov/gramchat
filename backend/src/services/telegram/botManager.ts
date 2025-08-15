import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { handleMessage } from './messageHandler';
import { config } from '../../config';

const bots = new Map<string, TelegramBot>();

export async function setupTelegramBots() {
  try {
    const activeBots = await prisma.bot.findMany({
      where: { isActive: true }
    });

    for (const bot of activeBots) {
      await createBot(bot.id, bot.botToken);
    }

    logger.info(`Initialized ${bots.size} Telegram bots`);
  } catch (error) {
    logger.error('Failed to setup Telegram bots:', error);
  }
}

export async function createBot(botId: string, botToken: string) {
  try {
    const bot = new TelegramBot(botToken, {
      polling: config.NODE_ENV !== 'production',
      webHook: config.NODE_ENV === 'production'
    });

    if (config.NODE_ENV === 'production' && config.TELEGRAM_WEBHOOK_DOMAIN) {
      const webhookUrl = `${config.TELEGRAM_WEBHOOK_DOMAIN}/api/telegram/webhook/${botId}`;
      await bot.setWebHook(webhookUrl);
    }

    bot.on('message', async (msg) => {
      await handleMessage(botId, bot, msg, botToken);
    });

    bot.on('error', (error) => {
      logger.error(`Bot error for bot ${botId}:`, error);
    });

    bots.set(botId, bot);
    logger.info(`Bot created for bot ${botId}`);

    return bot;
  } catch (error) {
    logger.error(`Failed to create bot for bot ${botId}:`, error);
    throw error;
  }
}

export function getBot(botId: string): TelegramBot | undefined {
  return bots.get(botId);
}

export function getBotById(botId: string): TelegramBot | undefined {
  return bots.get(botId);
}

export async function removeBot(botId: string) {
  const bot = bots.get(botId);
  if (bot) {
    await bot.stopPolling();
    bots.delete(botId);
    logger.info(`Bot removed for bot ${botId}`);
  }
}

export async function initializeAllBots() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const allBots = await prisma.bot.findMany({
      where: { isActive: true }
    });
    
    logger.info(`Initializing ${allBots.length} bots...`);
    
    for (const bot of allBots) {
      try {
        await createBot(bot.id, bot.botToken);
        logger.info(`Bot ${bot.botUsername} initialized successfully`);
      } catch (error) {
        logger.error(`Failed to initialize bot ${bot.botUsername}:`, error);
      }
    }
    
    logger.info(`All bots initialized. Total active: ${bots.size}`);
  } catch (error) {
    logger.error('Failed to initialize bots:', error);
  }
}