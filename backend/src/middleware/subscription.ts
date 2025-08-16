import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { AppError } from './errorHandler';

/**
 * Проверяет, может ли пользователь создать нового бота
 */
export const checkBotLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const limits = await SubscriptionService.checkLimits(userId, 'bots');
    
    if (!limits.allowed) {
      throw new AppError(
        403, 
        `Достигнут лимит ботов вашего тарифа (${limits.current}/${limits.limit}). Пожалуйста, обновите тариф для добавления новых ботов.`
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, может ли пользователь создать новый диалог
 */
export const checkDialogLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const limits = await SubscriptionService.checkLimits(userId, 'dialogs');
    
    if (!limits.allowed) {
      throw new AppError(
        403, 
        `Достигнут лимит диалогов вашего тарифа (${limits.current}/${limits.limit}). Пожалуйста, обновите тариф или дождитесь начала нового месяца.`
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, может ли пользователь добавить нового менеджера
 */
export const checkManagerLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const limits = await SubscriptionService.checkLimits(userId, 'managers');
    
    if (!limits.allowed) {
      throw new AppError(
        403, 
        `Достигнут лимит менеджеров вашего тарифа (${limits.current}/${limits.limit}). Пожалуйста, обновите тариф для добавления новых менеджеров.`
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, активна ли подписка пользователя
 */
export const checkSubscriptionActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { prisma } = require('../utils/prisma');
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription || !subscription.isActive) {
      throw new AppError(403, 'Ваша подписка неактивна. Пожалуйста, обновите подписку для продолжения работы.');
    }
    
    // Проверяем, не истек ли триальный период
    if (subscription.isTrial && subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
      // Переводим на бесплатный тариф
      await SubscriptionService.updatePlan(userId, 'FREE');
      throw new AppError(403, 'Ваш триальный период истек. Вы были переведены на бесплатный тариф.');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};