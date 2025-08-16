import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { verifyPassword } from '../utils/password.utils';
import { verifyTelegramAuth } from '../utils/telegram-auth.utils';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();

const loginSchema = z.object({
  telegramId: z.string(),
  firstName: z.string(),
  lastName: z.string().optional(),
  username: z.string().optional()
});

const emailLoginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен')
});

const telegramWidgetSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
  inviteCode: z.string().optional()
});

// Telegram Login Widget для админов и владельцев
router.post('/telegram-widget-login', async (req, res, next) => {
  try {
    const validation = telegramWidgetSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Некорректные данные авторизации');
    }

    const authData = validation.data;
    
    // Проверяем подпись от Telegram
    const botToken = process.env.TELEGRAM_AUTH_BOT_TOKEN;
    if (!botToken) {
      throw new AppError(500, 'Telegram bot token not configured');
    }
    
    if (!verifyTelegramAuth(authData, botToken)) {
      throw new AppError(401, 'Неверная подпись авторизации');
    }

    const telegramId = BigInt(authData.id);
    
    // Проверяем существующего пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        ownedBots: true,
        managedBots: {
          include: {
            bot: true
          }
        }
      }
    });

    if (!user) {
      // Проверяем, является ли это постоянным админом
      const isPermanentAdmin = authData.id.toString() === '236692046';
      const isFirstAdmin = (await prisma.user.count()) === 0 && 
                          authData.id.toString() === process.env.FIRST_ADMIN_TELEGRAM_ID;
      
      let role: UserRole | undefined = 'OWNER'; // По умолчанию новые пользователи - владельцы
      let hasFullAccess = false;
      let inviteCodeId: string | undefined;
      
      if (isPermanentAdmin || isFirstAdmin) {
        role = 'ADMIN';
        hasFullAccess = true;
      } else if (authData.inviteCode) {
        // Проверяем инвайт-код
        const invite = await prisma.inviteCode.findUnique({
          where: { 
            code: authData.inviteCode
          }
        });
        
        if (!invite) {
          throw new AppError(400, 'Неверный инвайт-код');
        }
        
        if (!invite.isActive) {
          throw new AppError(400, 'Инвайт-код неактивен');
        }
        
        if (invite.expiresAt && invite.expiresAt < new Date()) {
          throw new AppError(400, 'Срок действия инвайт-кода истек');
        }
        
        if (invite.usedCount >= invite.maxUses) {
          throw new AppError(400, 'Инвайт-код уже использован максимальное количество раз');
        }
        
        role = invite.role as UserRole;
        hasFullAccess = true; // Все пользователи с инвайт-кодом получают полный доступ
        inviteCodeId = invite.id;
        
        // Обновляем счетчик использований
        await prisma.inviteCode.update({
          where: { id: invite.id },
          data: { usedCount: invite.usedCount + 1 }
        });
      }
      // Если нет инвайт-кода, владелец регистрируется с ограничениями (hasFullAccess = false)
      
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: authData.first_name,
          lastName: authData.last_name,
          username: authData.username,
          role,
          hasFullAccess,
          inviteCodeId
        },
        include: {
          ownedBots: true,
          managedBots: {
            include: {
              bot: true
            }
          }
        }
      });
      
      // Создаем подписку для нового пользователя
      if (role === 'OWNER') {
        // Владельцы получают бесплатный тариф по умолчанию
        // Можно активировать триал PRO при определенных условиях
        await SubscriptionService.createSubscription(user.id, 'FREE', false);
      }
    } else {
      // Обновляем данные существующего пользователя
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: authData.first_name,
          lastName: authData.last_name || user.lastName,
          username: authData.username || user.username
        },
        include: {
          ownedBots: true,
          managedBots: {
            include: {
              bot: true
            }
          }
        }
      });
    }

    if (!user.isActive) {
      throw new AppError(403, 'Аккаунт деактивирован');
    }

    // Все роли могут авторизовываться через Telegram Widget

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Создаем сессию
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        hasFullAccess: user.hasFullAccess,
        bots: user.ownedBots || user.managedBots?.map(mb => mb.bot),
        hasApprovedBots: user.ownedBots?.some(bot => bot.isApproved) ?? false,
        needsBotCreation: user.role === 'OWNER' && user.ownedBots?.length === 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Email/Password логин удален - менеджеры теперь авторизуются только через инвайт-коды с Telegram Widget

router.post('/telegram-login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    // Этот эндпоинт устарел и больше не должен использоваться для новых регистраций
    // Только для существующих пользователей
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(data.telegramId) }
    });

    if (!user) {
      throw new AppError(403, 'Registration requires an invite code. Please use the new auth flow.');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is disabled');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/validate-token', async (req, res, next) => {
  try {
    const { token, inviteCode } = req.body;
    console.log('🔐 Validate token request:', { token, inviteCode });
    
    if (!token) {
      throw new AppError(400, 'Token is required');
    }

    // Импортируем authBot для проверки токена
    const { authBot } = await import('../services/authBot.service');
    const telegramUserId = await authBot.validateToken(token);
    console.log('🔍 Token validation result:', telegramUserId);
    
    if (!telegramUserId) {
      throw new AppError(401, 'Invalid or expired token');
    }

    // Получаем данные пользователя из Telegram API
    const botToken = process.env.TELEGRAM_AUTH_BOT_TOKEN;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${telegramUserId}`);
    const chatData: any = await response.json();
    
    if (!chatData.ok) {
      throw new AppError(400, 'Failed to get user data');
    }

    const userData = chatData.result;
    
    // Создаем или обновляем пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUserId) }
    });
    console.log('👤 Existing user:', user);

    if (!user) {
      // Проверяем, является ли это постоянным админом
      const isPermanentAdmin = telegramUserId.toString() === '236692046';
      const isFirstAdmin = (await prisma.user.count() === 0) && telegramUserId.toString() === process.env.FIRST_ADMIN_TELEGRAM_ID;
      console.log('🆕 New user registration:', { isPermanentAdmin, isFirstAdmin, telegramUserId });
      
      let role: UserRole | null = null;
      // Managers are assigned to bots after registration
      let inviteCodeId: string | undefined;
      let hasApprovedShop = false; // Флаг для контроля доступа
      
      if (isPermanentAdmin || isFirstAdmin) {
        role = 'ADMIN';
      } else if (inviteCode) {
        // Проверяем инвайт-код
        const invite = await prisma.inviteCode.findUnique({
          where: { code: inviteCode }
        });
        
        if (!invite) {
          throw new AppError(400, 'Неверный инвайт-код');
        }
        
        if (!invite.isActive) {
          throw new AppError(400, 'Инвайт-код неактивен');
        }
        
        if (invite.expiresAt && invite.expiresAt < new Date()) {
          throw new AppError(400, 'Срок действия инвайт-кода истек');
        }
        
        if (invite.usedCount >= invite.maxUses) {
          throw new AppError(400, 'Инвайт-код уже использован максимальное количество раз');
        }
        
        role = invite.role as UserRole;
        inviteCodeId = invite.id;
        
        // Managers are assigned to bots after registration, not during
        // No need for botId assignment here
        
        hasApprovedShop = true; // Все пользователи с инвайт-кодом получают полный доступ
        
        // Обновляем счетчик использований
        await prisma.inviteCode.update({
          where: { id: invite.id },
          data: { usedCount: invite.usedCount + 1 }
        });
      } else {
        // Новые пользователи без инвайт-кода могут быть только владельцами
        role = 'OWNER';
        hasApprovedShop = false; // Владельцы без инвайт-кода имеют ограниченный доступ
      }
      
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramUserId),
          firstName: userData.first_name || 'User',
          lastName: userData.last_name,
          username: userData.username,
          role: role!,
          inviteCodeId
          // Bot assignments handled through BotManager after registration
        }
      });
      
      // Создаем подписку для нового пользователя
      if (role === 'OWNER') {
        await SubscriptionService.createSubscription(user.id, 'FREE', false);
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: userData.first_name || user.firstName,
          lastName: userData.last_name || user.lastName,
          username: userData.username || user.username
        }
      });
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is disabled');
    }

    // Получаем информацию о ботах пользователя
    const userWithBots = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedBots: true,
        managedBots: {
          include: {
            bot: true
          }
        }
      }
    });

    const jwtToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        bots: userWithBots?.ownedBots || userWithBots?.managedBots?.map(mb => mb.bot),
        hasApprovedBots: userWithBots?.ownedBots?.some(bot => bot.isApproved) ?? false,
        needsBotCreation: user.role === 'OWNER' && userWithBots?.ownedBots?.length === 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Смена собственного пароля
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const changePasswordSchema = z.object({
      currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
      newPassword: z.string().min(8, 'Пароль должен быть не менее 8 символов')
    });

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Некорректные данные');
    }

    const { currentPassword, newPassword } = validation.data;
    const userId = req.user!.id;

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.passwordHash) {
      throw new AppError(400, 'Смена пароля недоступна для этого аккаунта');
    }

    // Проверяем текущий пароль
    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Неверный текущий пароль');
    }

    // Хешируем новый пароль
    const { hashPassword } = await import('../utils/password.utils');
    const newPasswordHash = await hashPassword(newPassword);

    // Обновляем пароль
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        requirePasswordChange: false
      }
    });

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        ownedBots: true,
        managedBots: {
          include: {
            bot: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Get first bot for backward compatibility
    const firstOwnedBot = user.ownedBots?.[0];
    const firstManagedBot = user.managedBots?.[0]?.bot;
    const primaryBot = firstOwnedBot || firstManagedBot;

    res.json({
      id: user.id,
      telegramId: user.telegramId?.toString() || '',
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      hasFullAccess: user.hasFullAccess,
      shop: primaryBot, // For backward compatibility
      hasApprovedShop: firstOwnedBot?.isApproved ?? false,
      needsShopCreation: user.role === 'OWNER' && user.ownedBots.length === 0,
      // New fields for bot support
      ownedBots: user.ownedBots,
      managedBots: user.managedBots.map(mb => mb.bot)
    });
  } catch (error) {
    next(error);
  }
});

export default router;