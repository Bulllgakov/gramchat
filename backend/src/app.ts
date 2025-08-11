import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { generalLimiter, authLimiter, createResourceLimiter, messageLimiter, apiLimiter } from './middleware/rateLimiter';
import { conditionalCsrf, getCsrfToken } from './middleware/csrf';
import authRoutes from './routes/auth.routes';
import shopRoutes from './routes/shop.routes';
import dialogRoutes from './routes/dialog.routes';
import adminRoutes from './routes/admin.routes';
import ownerRoutes from './routes/owner.routes';
import analyticsRoutes from './routes/analytics.routes';
import uploadRoutes from './routes/upload.routes';
import managerRoutes from './routes/manager.routes';
import path from 'path';

export const createApp = async () => {
  const app = express();

  // Redis client setup
  const redisClient = createClient({
    url: config.REDIS_URL
  });
  
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  await redisClient.connect();

  // Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
      },
    },
  }));
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
  }));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined'));
  
  // Статические файлы для загруженных файлов
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Rate limiting - применяем общий лимитер ко всем запросам
  // app.use(generalLimiter); // Отключено для разработки

  // Session setup
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  }));

  // CSRF защита для всех не-GET запросов
  // app.use(conditionalCsrf);

  // Эндпоинт для получения CSRF токена
  // app.get('/api/csrf-token', getCsrfToken);

  // Routes с применением специфичных лимитеров
  app.use('/auth', authRoutes); // authLimiter отключен для разработки
  app.use('/shops', shopRoutes); // apiLimiter отключен для разработки
  app.use('/dialogs', dialogRoutes); // apiLimiter отключен для разработки
  app.use('/admin', adminRoutes); // apiLimiter отключен для разработки
  app.use('/owner', ownerRoutes); // apiLimiter отключен для разработки
  app.use('/analytics', analyticsRoutes); // apiLimiter отключен для разработки
  app.use('/upload', uploadRoutes); // apiLimiter отключен для разработки
  app.use('/managers', managerRoutes); // apiLimiter отключен для разработки

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler as any);

  return app;
};
