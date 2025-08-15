import { Router } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { getBotById } from '../services/telegram/botManager';
import { handleMessage } from '../services/telegram/messageHandler';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Webhook endpoint for Telegram bots
router.post('/telegram/webhook/:botId', async (req: any, res: any) => {
  try {
    const { botId } = req.params;
    const update = req.body;
    
    logger.info(`Received webhook for bot ${botId}`, { update });
    
    // Get bot from manager
    const bot = getBotById(botId);
    if (!bot) {
      logger.error(`Bot not found in manager: ${botId}`);
      
      // Try to get bot from database and reinitialize
      const dbBot = await prisma.bot.findUnique({
        where: { id: botId }
      });
      
      if (!dbBot) {
        logger.error(`Bot not found in database: ${botId}`);
        return res.status(404).json({ error: 'Bot not found' });
      }
      
      // Bot exists in DB but not in memory - this shouldn't happen in production
      logger.warn(`Bot ${botId} exists in DB but not in memory`);
      return res.status(503).json({ error: 'Bot not initialized' });
    }
    
    // Get bot token from database
    const dbBot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { botToken: true }
    });
    
    if (!dbBot) {
      logger.error(`Bot not found in database for token: ${botId}`);
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Process the update
    if (update.message) {
      await handleMessage(botId, bot, update.message, dbBot.botToken);
    } else if (update.callback_query) {
      // Handle callback queries if needed
      logger.info(`Received callback query for bot ${botId}`, update.callback_query);
    }
    
    // Telegram expects 200 OK response
    res.sendStatus(200);
  } catch (error) {
    logger.error('Webhook error:', error);
    // Still return 200 to prevent Telegram from retrying
    res.sendStatus(200);
  }
});

export default router;