import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { MessageType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { getFileUrl } from '../../middleware/upload';

export async function handleMessage(
  shopId: string,
  bot: TelegramBot,
  msg: TelegramBot.Message,
  botToken: string
) {
  try {
    const chatId = msg.chat.id;
    const messageType = getMessageType(msg);
    
    // Find or create dialog
    let dialog = await prisma.dialog.findFirst({
      where: {
        telegramChatId: BigInt(chatId),
        shopId
      }
    });

    if (!dialog) {
      // Try to get user profile photo
      let customerPhotoUrl: string | null = null;
      if (msg.from?.id) {
        try {
          const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
          if (photos.total_count > 0 && photos.photos[0]) {
            const photo = photos.photos[0][0]; // Get smallest size
            const file = await bot.getFile(photo.file_id);
            if (file.file_path) {
              // Download the photo and convert to base64
              customerPhotoUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
            }
          }
        } catch (error) {
          logger.warn('Failed to get user profile photo:', error);
        }
      }

      dialog = await prisma.dialog.create({
        data: {
          telegramChatId: BigInt(chatId),
          shopId,
          customerName: msg.from?.first_name || 'Unknown',
          customerUsername: msg.from?.username,
          customerPhotoUrl,
          status: 'NEW'
        }
      });
    }

    // Save media file if present
    let mediaData: { fileUrl: string; fileName: string; fileSize: number; mimeType: string } | null = null;
    if (messageType !== 'TEXT' && messageType !== 'STICKER' && messageType !== 'LOCATION') {
      mediaData = await saveMediaFile(bot, msg, messageType, botToken);
    }

    // Get message text
    let messageText = msg.text || msg.caption || '';
    if (!messageText && messageType !== 'TEXT') {
      messageText = `[${messageType}]`;
    }

    // Save message
    await prisma.message.create({
      data: {
        dialogId: dialog.id,
        text: messageText,
        fromUser: true,
        messageType,
        telegramId: BigInt(msg.message_id),
        ...(mediaData && {
          fileUrl: mediaData.fileUrl,
          fileName: mediaData.fileName,
          fileSize: mediaData.fileSize,
          mimeType: mediaData.mimeType
        })
      }
    });

    // Update dialog last message time and reopen if closed
    const updateData: any = { 
      lastMessageAt: new Date()
    };
    
    // Если диалог был закрыт - открываем и освобождаем
    if (dialog.status === 'CLOSED') {
      updateData.status = 'ACTIVE';
      updateData.assignedToId = null;
      updateData.assignedAt = null;
    } else if (dialog.status === 'NEW') {
      updateData.status = 'ACTIVE';
    }
    
    // Update photo URL if it's missing and we have user ID
    if (!dialog.customerPhotoUrl && msg.from?.id) {
      logger.info(`Attempting to get profile photo for user ${msg.from.id}`);
      try {
        const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
        logger.info(`getUserProfilePhotos result: total_count=${photos.total_count}`);
        
        if (photos.total_count > 0 && photos.photos[0]) {
          const photo = photos.photos[0][0]; // Get smallest size
          logger.info(`Getting file for photo: ${photo.file_id}`);
          
          const file = await bot.getFile(photo.file_id);
          if (file.file_path) {
            updateData.customerPhotoUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
            logger.info(`Profile photo URL set: ${updateData.customerPhotoUrl}`);
          } else {
            logger.warn('No file_path in getFile response');
          }
        } else {
          logger.info('User has no profile photos');
        }
      } catch (error) {
        logger.warn('Failed to get user profile photo:', error);
      }
    } else {
      logger.info(`Skip photo update: has photo=${!!dialog.customerPhotoUrl}, has user=${!!msg.from?.id}`);
    }
    
    await prisma.dialog.update({
      where: { id: dialog.id },
      data: updateData
    });

    // Send auto-reply if dialog is new
    if (dialog.status === 'NEW') {
      await bot.sendMessage(
        chatId,
        'Здравствуйте! Ваше сообщение получено. Менеджер скоро ответит вам.',
        { reply_to_message_id: msg.message_id }
      );
    }

    // Emit socket event
    const io = global.io;
    if (io) {
      io.to(`shop-${shopId}`).emit('new-message', {
        dialogId: dialog.id,
        message: {
          text: messageText,
          fromUser: true,
          messageType,
          createdAt: new Date(),
          ...(mediaData && {
            fileUrl: mediaData.fileUrl,
            fileName: mediaData.fileName,
            fileSize: mediaData.fileSize,
            mimeType: mediaData.mimeType
          })
        }
      });
    }

    logger.info(`Message handled for shop ${shopId}, dialog ${dialog.id}`);
  } catch (error) {
    logger.error('Error handling message:', error);
  }
}

function getMessageType(msg: TelegramBot.Message): MessageType {
  if (msg.photo) return 'PHOTO';
  if (msg.video) return 'VIDEO';
  if (msg.document) return 'DOCUMENT';
  if (msg.voice) return 'VOICE';
  if (msg.sticker) return 'STICKER';
  if (msg.location) return 'LOCATION';
  return 'TEXT';
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function saveMediaFile(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  messageType: MessageType,
  botToken: string
): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string } | null> {
  try {
    let fileId: string | undefined;
    let fileName = 'unknown';
    let mimeType = 'application/octet-stream';

    // Get file ID based on message type
    if (msg.photo && msg.photo.length > 0) {
      // Get the largest photo
      fileId = msg.photo[msg.photo.length - 1].file_id;
      fileName = `photo_${Date.now()}.jpg`;
      mimeType = 'image/jpeg';
    } else if (msg.video) {
      fileId = msg.video.file_id;
      fileName = (msg.video as any).file_name || `video_${Date.now()}.mp4`;
      mimeType = msg.video.mime_type || 'video/mp4';
    } else if (msg.document) {
      fileId = msg.document.file_id;
      fileName = msg.document.file_name || `document_${Date.now()}`;
      mimeType = msg.document.mime_type || 'application/octet-stream';
    } else if (msg.voice) {
      fileId = msg.voice.file_id;
      fileName = `voice_${Date.now()}.ogg`;
      mimeType = msg.voice.mime_type || 'audio/ogg';
    }

    if (!fileId) {
      return null;
    }

    // Get file info from Telegram
    const file = await bot.getFile(fileId);
    if (!file.file_path) {
      return null;
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../../uploads');
    const fileTypeDir = messageType.toLowerCase();
    const destDir = path.join(uploadDir, fileTypeDir);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '');
    const uniqueFileName = `${cleanName}-${uniqueSuffix}${ext}`;
    const destPath = path.join(destDir, uniqueFileName);

    // Download file
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    await downloadFile(downloadUrl, destPath);

    // Get file size
    const stats = fs.statSync(destPath);
    const fileSize = stats.size;

    // Get public URL
    const fileUrl = getFileUrl(uniqueFileName, fileTypeDir);

    return {
      fileUrl,
      fileName,
      fileSize,
      mimeType
    };
  } catch (error) {
    logger.error('Error saving media file:', error);
    return null;
  }
}