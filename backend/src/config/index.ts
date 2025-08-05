import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string(),
  SESSION_SECRET: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  TELEGRAM_WEBHOOK_DOMAIN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  // Email configuration
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform(Number).optional(),
  EMAIL_SECURE: z.string().transform(val => val === 'true').optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const configData = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-jwt-key-change-in-production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-session-key-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  TELEGRAM_WEBHOOK_DOMAIN: process.env.TELEGRAM_WEBHOOK_DOMAIN,
  LOG_LEVEL: process.env.LOG_LEVEL,
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_SECURE: process.env.EMAIL_SECURE,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  FRONTEND_URL: process.env.FRONTEND_URL,
};

export const config = configSchema.parse(configData);