import express, { Express, Request, Response } from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';
  import { PrismaClient } from '@prisma/client';
  import { createServer } from 'http';
  import { Server } from 'socket.io';
  import helmet from 'helmet';
  import compression from 'compression';
  import morgan from 'morgan';

  // Import routes
  import authRoutes from './routes/auth.routes';
  import botRoutes from './routes/bot.routes';
  import botManagerRoutes from './routes/bot-manager.routes';
  import dialogRoutes from './routes/dialog.routes';
  import adminRoutes from './routes/admin.routes';
  import ownerRoutes from './routes/owner.routes';
  import managerRoutes from './routes/manager.routes';
  import uploadRoutes from './routes/upload.routes';
  import analyticsRoutes from './routes/analytics.routes';

  // Import middleware
  import { errorHandler } from './middleware/errorHandler';

 (BigInt.prototype as any).toJSON = function() {
    return this.toString();
  };

  // Load environment variables
  dotenv.config();

  // Initialize Express
  const app: Express = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  // Initialize Prisma
  const prisma = new PrismaClient();

  // Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(compression());
  app.use(morgan('combined'));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/auth', authRoutes);
  app.use('/bots', botRoutes);
  app.use('/bot-manager', botManagerRoutes);
  app.use('/dialogs', dialogRoutes);
  app.use('/admin', adminRoutes);
  app.use('/owner', ownerRoutes);
  app.use('/managers', managerRoutes);
  app.use('/upload', uploadRoutes);
  app.use('/analytics', analyticsRoutes);

  // Error handler
  app.use(errorHandler);

  // Socket.IO setup
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-bot', (botId: string) => {
      socket.join(`bot-${botId}`);
      console.log(`Socket ${socket.id} joined bot-${botId}`);
    });
    
    // Legacy support for old clients
    socket.on('join-shop', (shopId: string) => {
      // Redirect to bot room for backward compatibility
      socket.join(`bot-${shopId}`);
      console.log(`Socket ${socket.id} joined bot-${shopId} (legacy shop event)`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Export io for use in other modules
  export { io };

  // Start server
  const PORT = process.env.PORT || 3000;

  async function startServer() {
    try {
      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connected');

      // Start server
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
	console.log(`📍 API endpoints registered at: http://localhost:${PORT}`);
        console.log('📌 Available routes:');
	console.log('   - POST /auth/telegram-widget-login');
  	console.log('   - GET  /auth/me');
  	console.log('   - POST /auth/logout');


      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await prisma.$disconnect();
    server.close();
    process.exit(0);
  });

  startServer();
