import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const periodSchema = z.enum(['today', 'week', 'month']);

// Получить личную аналитику
router.get('/', authenticate, async (req, res, next) => {
  try {
    const period = periodSchema.parse(req.query.period || 'week');
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    // Определяем временной диапазон
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
    }
    
    // Базовый запрос в зависимости от роли
    let whereCondition: any = {
      createdAt: { gte: startDate }
    };
    
    if (userRole === 'MANAGER') {
      whereCondition.assignedToId = userId;
    } else if (userRole === 'OWNER') {
      const shop = await prisma.shop.findUnique({
        where: { ownerId: userId }
      });
      if (!shop) throw new AppError(404, 'Shop not found');
      whereCondition.shopId = shop.id;
    }
    
    // Получаем статистику по диалогам
    const [
      totalDialogs,
      newDialogs,
      activeDialogs,
      closedDialogs,
      dealsCount,
      cancelledCount,
      totalMessages,
      // Действия с диалогами
      assignedCount,
      releasedCount,
      transferredCount,
      // Для сравнения с предыдущим периодом
      previousTotalDialogs,
      previousDeals
    ] = await Promise.all([
      prisma.dialog.count({ where: whereCondition }),
      prisma.dialog.count({ where: { ...whereCondition, status: 'NEW' } }),
      prisma.dialog.count({ where: { ...whereCondition, status: 'ACTIVE' } }),
      prisma.dialog.count({ where: { ...whereCondition, status: 'CLOSED' } }),
      prisma.dialog.count({ where: { ...whereCondition, closeReason: 'DEAL' } }),
      prisma.dialog.count({ where: { ...whereCondition, closeReason: 'CANCELLED' } }),
      prisma.message.count({ 
        where: { 
          dialog: whereCondition,
          fromUser: false 
        } 
      }),
      // Действия с диалогами
      prisma.dialogAction.count({
        where: {
          userId: userId,
          action: 'ASSIGNED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.dialogAction.count({
        where: {
          userId: userId,
          action: 'RELEASED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.dialogAction.count({
        where: {
          userId: userId,
          action: 'TRANSFERRED',
          createdAt: { gte: startDate }
        }
      }),
      // Предыдущий период
      prisma.dialog.count({ 
        where: { 
          ...whereCondition,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate 
          }
        } 
      }),
      prisma.dialog.count({ 
        where: { 
          ...whereCondition,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate 
          },
          closeReason: 'DEAL'
        } 
      })
    ]);
    
    // Рассчитываем среднее время ответа (в минутах)
    const dialogsWithMessages = await prisma.dialog.findMany({
      where: whereCondition,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 2
        }
      }
    });
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    dialogsWithMessages.forEach(dialog => {
      if (dialog.messages.length >= 2) {
        const firstUserMessage = dialog.messages.find(m => m.fromUser);
        const firstManagerMessage = dialog.messages.find(m => !m.fromUser);
        
        if (firstUserMessage && firstManagerMessage) {
          const responseTime = (firstManagerMessage.createdAt.getTime() - firstUserMessage.createdAt.getTime()) / 1000 / 60;
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });
    
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    
    // Рассчитываем изменения в процентах
    const dialogsChange = previousTotalDialogs > 0 
      ? Math.round(((totalDialogs - previousTotalDialogs) / previousTotalDialogs) * 100)
      : 0;
    
    const dealsChange = previousDeals > 0
      ? Math.round(((dealsCount - previousDeals) / previousDeals) * 100)
      : 0;
    
    res.json({
      totalDialogs,
      newDialogs,
      activeDialogs,
      closedDialogs,
      dealsCount,
      cancelledCount,
      avgResponseTime,
      totalMessages,
      // Новые метрики действий
      assignedCount,
      releasedCount,
      transferredCount,
      periodComparison: {
        dialogsChange,
        dealsChange,
        responseTimeChange: 0 // TODO: сравнить со средним временем предыдущего периода
      }
    });
  } catch (error) {
    next(error);
  }
});

// Получить аналитику по менеджерам (только для владельцев)
router.get('/managers', authenticate, async (req, res, next) => {
  try {
    if (req.user!.role !== 'OWNER') {
      throw new AppError(403, 'Access denied');
    }
    
    const period = periodSchema.parse(req.query.period || 'week');
    
    // Получаем магазин владельца
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user!.id },
      include: {
        managers: true
      }
    });
    
    if (!shop) throw new AppError(404, 'Shop not found');
    
    // Определяем временной диапазон
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
    }
    
    // Собираем статистику по каждому менеджеру
    const managersAnalytics = await Promise.all(
      shop.managers.map(async (manager) => {
        const whereCondition = {
          shopId: shop.id,
          assignedToId: manager.id,
          createdAt: { gte: startDate }
        };
        
        const [
          totalDialogs,
          dealsCount,
          totalMessages,
          assignedCount,
          releasedCount,
          transferredCount
        ] = await Promise.all([
          prisma.dialog.count({ where: whereCondition }),
          prisma.dialog.count({ where: { ...whereCondition, closeReason: 'DEAL' } }),
          prisma.message.count({ 
            where: { 
              dialog: whereCondition,
              fromUser: false 
            } 
          }),
          prisma.dialogAction.count({
            where: {
              userId: manager.id,
              action: 'ASSIGNED',
              createdAt: { gte: startDate }
            }
          }),
          prisma.dialogAction.count({
            where: {
              userId: manager.id,
              action: 'RELEASED',
              createdAt: { gte: startDate }
            }
          }),
          prisma.dialogAction.count({
            where: {
              userId: manager.id,
              action: 'TRANSFERRED',
              createdAt: { gte: startDate }
            }
          })
        ]);
        
        // Рассчитываем среднее время ответа
        const dialogsWithMessages = await prisma.dialog.findMany({
          where: whereCondition,
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 2
            }
          }
        });
        
        let totalResponseTime = 0;
        let responseCount = 0;
        
        dialogsWithMessages.forEach(dialog => {
          if (dialog.messages.length >= 2) {
            const firstUserMessage = dialog.messages.find(m => m.fromUser);
            const firstManagerMessage = dialog.messages.find(m => !m.fromUser);
            
            if (firstUserMessage && firstManagerMessage) {
              const responseTime = (firstManagerMessage.createdAt.getTime() - firstUserMessage.createdAt.getTime()) / 1000 / 60;
              totalResponseTime += responseTime;
              responseCount++;
            }
          }
        });
        
        const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
        
        return {
          managerId: manager.id,
          managerName: `${manager.firstName} ${manager.lastName || ''}`.trim(),
          totalDialogs,
          newDialogs: 0, // TODO: добавить подсчет
          activeDialogs: 0, // TODO: добавить подсчет
          closedDialogs: 0, // TODO: добавить подсчет
          dealsCount,
          cancelledCount: 0, // TODO: добавить подсчет
          avgResponseTime,
          totalMessages,
          // Действия с диалогами
          assignedCount,
          releasedCount,
          transferredCount
        };
      })
    );
    
    res.json({
      managers: managersAnalytics.sort((a, b) => b.dealsCount - a.dealsCount)
    });
  } catch (error) {
    next(error);
  }
});

export default router;