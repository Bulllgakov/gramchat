import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Схема валидации реквизитов
const companyDetailsSchema = z.object({
  companyName: z.string().min(1, 'Название компании обязательно'),
  legalForm: z.string().optional(),
  inn: z.string().regex(/^\d{10}$|^\d{12}$/, 'ИНН должен состоять из 10 или 12 цифр'),
  kpp: z.string().regex(/^\d{9}$/, 'КПП должен состоять из 9 цифр').optional().or(z.literal('')),
  ogrn: z.string().regex(/^\d{13}$|^\d{15}$/, 'ОГРН должен состоять из 13 или 15 цифр').optional().or(z.literal('')),
  
  legalAddress: z.string().min(1, 'Юридический адрес обязателен'),
  postalAddress: z.string().optional(),
  
  bankName: z.string().min(1, 'Название банка обязательно'),
  bik: z.string().regex(/^\d{9}$/, 'БИК должен состоять из 9 цифр'),
  correspondentAccount: z.string().regex(/^\d{20}$/, 'Корр. счет должен состоять из 20 цифр').optional().or(z.literal('')),
  settlementAccount: z.string().regex(/^\d{20}$/, 'Расчетный счет должен состоять из 20 цифр'),
  
  phone: z.string().min(1, 'Телефон обязателен'),
  email: z.string().email('Некорректный email'),
  website: z.string().url('Некорректный URL').optional().or(z.literal('')),
  
  directorName: z.string().min(1, 'ФИО директора обязательно'),
  directorPosition: z.string().default('Генеральный директор'),
  directorBasis: z.string().default('Устава'),
  
  taxSystem: z.string().optional(),
  okpo: z.string().optional(),
  oktmo: z.string().optional(),
  okved: z.string().optional()
});

// Получить реквизиты компании (публичный эндпоинт для лендинга)
router.get('/public', async (req: any, res: any, next: any) => {
  try {
    const details = await prisma.companyDetails.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!details) {
      // Возвращаем дефолтные реквизиты если еще не настроены
      return res.json({
        companyName: 'ООО "ГрамЧат"',
        inn: '0000000000',
        legalAddress: 'Не указан',
        email: 'info@gramchat.ru',
        phone: '+7 (800) 000-00-00'
      });
    }
    
    res.json(details);
  } catch (error) {
    next(error);
  }
});

// Получить реквизиты компании (для админа)
router.get('/', authenticate, authorize('ADMIN'), async (req: any, res: any, next: any) => {
  try {
    const details = await prisma.companyDetails.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    
    res.json(details);
  } catch (error) {
    next(error);
  }
});

// Создать или обновить реквизиты компании
router.post('/', authenticate, authorize('ADMIN'), async (req: any, res: any, next: any) => {
  try {
    const validation = companyDetailsSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Некорректные данные');
    }
    
    const data = validation.data;
    
    // Проверяем, есть ли уже реквизиты
    const existing = await prisma.companyDetails.findFirst();
    
    let details;
    if (existing) {
      // Обновляем существующие
      details = await prisma.companyDetails.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Очищаем пустые строки
          kpp: data.kpp || null,
          ogrn: data.ogrn || null,
          postalAddress: data.postalAddress || null,
          correspondentAccount: data.correspondentAccount || null,
          website: data.website || null,
          taxSystem: data.taxSystem || null,
          okpo: data.okpo || null,
          oktmo: data.oktmo || null,
          okved: data.okved || null
        }
      });
    } else {
      // Создаем новые
      details = await prisma.companyDetails.create({
        data: {
          ...data,
          // Очищаем пустые строки
          kpp: data.kpp || null,
          ogrn: data.ogrn || null,
          postalAddress: data.postalAddress || null,
          correspondentAccount: data.correspondentAccount || null,
          website: data.website || null,
          taxSystem: data.taxSystem || null,
          okpo: data.okpo || null,
          oktmo: data.oktmo || null,
          okved: data.okved || null
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Реквизиты успешно сохранены',
      data: details
    });
  } catch (error) {
    next(error);
  }
});

// Удалить реквизиты компании
router.delete('/', authenticate, authorize('ADMIN'), async (req: any, res: any, next: any) => {
  try {
    const existing = await prisma.companyDetails.findFirst();
    
    if (!existing) {
      throw new AppError(404, 'Реквизиты не найдены');
    }
    
    await prisma.companyDetails.delete({
      where: { id: existing.id }
    });
    
    res.json({
      success: true,
      message: 'Реквизиты удалены'
    });
  } catch (error) {
    next(error);
  }
});

export default router;