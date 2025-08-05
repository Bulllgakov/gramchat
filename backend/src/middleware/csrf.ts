import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config';

// Настройка CSRF защиты
const { invalidCsrfTokenError, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.SESSION_SECRET, // Используем session secret для CSRF
  getSessionIdentifier: (req: any) => req.sessionID || 'anonymous', // Используем session ID
  cookieName: 'gramchat.x-csrf-token', // Remove __Host- prefix for localhost development
  cookieOptions: {
    sameSite: 'strict' as const,
    path: '/',
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
  },
});

// Middleware для генерации CSRF токена
export const csrfProtection = doubleCsrfProtection;

// Эндпоинт для получения CSRF токена  
export const getCsrfToken = (req: Request, res: Response) => {
  // В новой версии csrf-csrf токен создается автоматически через middleware
  // Просто возвращаем успешный ответ, токен будет в куки
  res.json({ message: 'CSRF protection enabled', cookieName: 'gramchat.x-csrf-token' });
};

// Список путей, для которых не требуется CSRF защита
const csrfExemptPaths = [
  '/api/auth/telegram-login', // Webhook от Telegram
  '/api/telegram/webhook', // Другие webhooks
  '/health', // Health check
];

// Middleware для условного применения CSRF защиты
export const conditionalCsrf = (req: Request, res: Response, next: NextFunction) => {
  // Пропускаем CSRF для GET запросов (они должны быть идемпотентными)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Пропускаем CSRF для исключенных путей
  if (csrfExemptPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Применяем CSRF защиту для остальных запросов
  csrfProtection(req, res, next);
};