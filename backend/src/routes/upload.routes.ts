import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload, validateFileSize, getFileUrl } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { getBot } from '../services/telegram/botManager';
import fs from 'fs';
import path from 'path';

const router = Router();

// Загрузка файла для отправки в диалог
router.post('/dialog/:dialogId', 
  authenticate, 
  uploadLimiter,
  upload.single('file'), 
  validateFileSize,
  async (req, res, next) => {
    try {
      const { dialogId } = req.params;
      const { caption } = req.body;
      
      if (!req.file) {
        throw new AppError(400, 'Файл не предоставлен');
      }

      // Проверяем доступ к диалогу
      const dialog = await prisma.dialog.findUnique({
        where: { id: dialogId },
        include: { shop: true }
      });

      if (!dialog) {
        throw new AppError(404, 'Диалог не найден');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { ownedShop: true, managedShop: true }
      });

      const hasAccess = 
        dialog.shop.ownerId === req.user!.id ||
        user?.managedShop?.id === dialog.shopId;

      if (!hasAccess) {
        throw new AppError(403, 'Нет доступа к диалогу');
      }

      // Получаем бота
      const bot = getBot(dialog.shopId);
      if (!bot) {
        throw new AppError(500, 'Бот недоступен');
      }

      // Определяем тип файла и отправляем через Telegram
      const fileType = req.file.mimetype.split('/')[0];
      const filePath = req.file.path;
      let sentMessage;

      try {
        switch (fileType) {
          case 'image':
            sentMessage = await bot.sendPhoto(Number(dialog.telegramChatId), filePath, {
              caption: caption || undefined
            });
            break;
          case 'video':
            sentMessage = await bot.sendVideo(Number(dialog.telegramChatId), filePath, {
              caption: caption || undefined
            });
            break;
          case 'audio':
            sentMessage = await bot.sendAudio(Number(dialog.telegramChatId), filePath, {
              caption: caption || undefined
            });
            break;
          default:
            sentMessage = await bot.sendDocument(Number(dialog.telegramChatId), filePath, {
              caption: caption || undefined
            });
        }

        // Получаем URL для доступа к файлу
        const fileUrl = getFileUrl(req.file.filename, fileType);

        // Сохраняем сообщение в БД
        const message = await prisma.message.create({
          data: {
            dialogId: dialogId,
            text: caption || `[${fileType}]`,
            fromUser: false,
            messageType: fileType.toUpperCase() as any,
            telegramId: BigInt(sentMessage.message_id),
            fileUrl: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
          }
        });

        // Обновляем диалог
        await prisma.dialog.update({
          where: { id: dialogId },
          data: { 
            lastMessageAt: new Date(),
            status: 'ACTIVE',
            assignedToId: dialog.assignedToId || req.user!.id,
            assignedAt: dialog.assignedAt || new Date()
          }
        });

        res.json({
          message,
          file: {
            url: fileUrl,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          }
        });
      } catch (error) {
        // Если отправка не удалась, удаляем файл
        fs.unlinkSync(filePath);
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

// Скачивание файла из сообщения
router.get('/message/:messageId', authenticate, async (req, res, next) => {
  try {
    const { messageId } = req.params;

    // Получаем сообщение
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        dialog: {
          include: { shop: true }
        }
      }
    });

    if (!message) {
      throw new AppError(404, 'Сообщение не найдено');
    }

    // Проверяем доступ
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { ownedShop: true, managedShop: true }
    });

    const hasAccess = 
      message.dialog.shop.ownerId === req.user!.id ||
      user?.managedShop?.id === message.dialog.shopId;

    if (!hasAccess) {
      throw new AppError(403, 'Нет доступа к файлу');
    }

    // Если это не медиа-сообщение
    if (message.messageType === 'TEXT') {
      throw new AppError(400, 'Сообщение не содержит файла');
    }

    // Получаем файл из Telegram
    const bot = getBot(message.dialog.shopId);
    if (!bot) {
      throw new AppError(500, 'Бот недоступен');
    }

    try {
      // Получаем информацию о сообщении из Telegram
      // К сожалению, node-telegram-bot-api не предоставляет прямого способа скачать файл по message_id
      // Поэтому возвращаем информацию о том, что файл нужно получить из Telegram
      res.json({
        message: 'Файлы из Telegram необходимо скачивать напрямую из мессенджера',
        messageType: message.messageType,
        text: message.text
      });
    } catch (error) {
      throw new AppError(500, 'Не удалось получить файл');
    }
  } catch (error) {
    next(error);
  }
});

export default router;