
import express, { Express, Request, Response } from 'express';

import cors from 'cors';

import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';



// Load environment variables

dotenv.config();



// Initialize Express

const app: Express = express();

const prisma = new PrismaClient();



// Middleware

app.use(cors());

app.use(express.json());



// Health check

app.get('/health', (req: Request, res: Response) => {

  res.json({ status: 'ok', timestamp: new Date().toISOString() });

});



// Start server

const PORT = process.env.PORT || 3000;



async function startServer() {

  try {

    // Test database connection

    await prisma.$connect();

    console.log('✅ Database connected');

    

    // Start server

    app.listen(PORT, () => {

      console.log(`🚀 Server running on port ${PORT}`);

      console.log(`📍 Health check: http://localhost:${PORT}/health`);

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

  process.exit(0);

});



startServer();

