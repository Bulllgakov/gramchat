import dotenv from 'dotenv';
dotenv.config();
console.log('🔥 ENV loaded in server.ts');
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from './utils/prisma';
import { setupTelegramBots } from './services/telegram/botManager';
import { authBot } from './services/authBot.service';

// Глобальная настройка для сериализации BigInt в JSON
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Initialize auth bot
    await authBot.init();
    
    // Create Express app
    const app = await createApp();
    const httpServer = createServer(app);

    // Setup Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: config.CORS_ORIGIN,
        credentials: true
      }
    });

    // Socket.io connection handling
    io.on('connection', (socket) => {
      logger.info(`New socket connection: ${socket.id}`);

      socket.on('join-shop', (shopId: string) => {
        socket.join(`shop-${shopId}`);
        logger.info(`Socket ${socket.id} joined shop-${shopId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // Make io available to routes
    app.set('io', io);
    
    // Make io available globally for messageHandler
    (global as any).io = io;

    // Setup Telegram bots for all active shops
    await setupTelegramBots();

    // Start server
    httpServer.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      // Stop auth bot first
      await authBot.stop();
      
      // Close HTTP server
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Disconnect database
      await prisma.$disconnect();
      
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
