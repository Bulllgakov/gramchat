import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { prisma } from '../utils/prisma';

// Middleware для проверки полного доступа владельца
export async function requireFullAccess(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    // Админы всегда имеют полный доступ
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Для владельцев проверяем hasFullAccess
    if (req.user.role === 'OWNER') {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { hasFullAccess: true }
      });

      if (!user?.hasFullAccess) {
        throw new AppError(403, 'Ограниченный доступ. Обратитесь к администратору для получения полного доступа.');
      }

      return next();
    }

    // Менеджеры не могут выполнять действия, требующие полного доступа
    throw new AppError(403, 'Недостаточно прав доступа');
  } catch (error) {
    next(error);
  }
}

// Middleware для проверки возможности отправки сообщений
export async function canSendMessages(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    // Админы и менеджеры всегда могут отправлять сообщения
    if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
      return next();
    }

    // Для владельцев проверяем hasFullAccess
    if (req.user.role === 'OWNER') {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { hasFullAccess: true }
      });

      if (!user?.hasFullAccess) {
        throw new AppError(403, 'Ваш аккаунт на модерации. Для ускорения можете обратиться @gramchat_shop_bot');
      }

      return next();
    }

    throw new AppError(403, 'Недостаточно прав доступа');
  } catch (error) {
    next(error);
  }
}