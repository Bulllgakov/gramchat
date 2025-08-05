import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

prisma.$on('query' as never, (e: any) => {
  logger.debug('Query:', e);
});

prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error:', e);
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn('Prisma warning:', e);
});