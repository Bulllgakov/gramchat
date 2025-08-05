import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Базовый лимитер для общих запросов
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с данного IP, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимитер для аутентификации
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа
  message: 'Слишком много попыток входа, попробуйте через 15 минут',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // не считать успешные запросы
});

// Лимитер для создания ресурсов (магазины, инвайт-коды)
export const createResourceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 создаваемых ресурсов в час
  message: 'Превышен лимит создания ресурсов, попробуйте через час',
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимитер для отправки сообщений
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // максимум 30 сообщений в минуту
  message: 'Слишком много сообщений, подождите минуту',
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимитер для API запросов от авторизованных пользователей
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов для авторизованных пользователей (увеличено для разработки)
  message: 'Превышен лимит API запросов',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Используем user ID для авторизованных пользователей, иначе IP
    return (req as any).user?.id || req.ip;
  },
});

// Лимитер для загрузки файлов
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // максимум 20 загрузок в час
  message: 'Превышен лимит загрузки файлов',
  standardHeaders: true,
  legacyHeaders: false,
});

// Функция для создания динамического лимитера на основе роли пользователя
export const createRoleLimiter = (defaultMax: number) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return defaultMax;
      
      // Разные лимиты для разных ролей
      switch (user.role) {
        case 'ADMIN':
          return defaultMax * 10; // Админы имеют 10x лимит
        case 'OWNER':
          return defaultMax * 2; // Владельцы имеют 2x лимит
        case 'MANAGER':
          return defaultMax; // Менеджеры имеют стандартный лимит
        default:
          return defaultMax;
      }
    },
    message: 'Превышен лимит запросов для вашей роли',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return (req as any).user?.id || req.ip;
    },
  });
};