import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Создаем директорию для загрузок, если её нет
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Поддерживаемые типы файлов
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

// Максимальные размеры файлов (в байтах)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024, // 20MB
  audio: 20 * 1024 * 1024 // 20MB
};

// Функция для определения типа файла
const getFileType = (mimeType: string): string | null => {
  for (const [type, mimes] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type;
    }
  }
  return null;
};

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Создаем подпапку для каждого типа файлов
    const fileType = getFileType(file.mimetype) || 'other';
    const destPath = path.join(uploadDir, fileType);
    
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Очищаем имя файла от специальных символов
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '');
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// Фильтр файлов
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileType = getFileType(file.mimetype);
  
  if (!fileType) {
    cb(new AppError(400, 'Неподдерживаемый тип файла'));
    return;
  }
  
  cb(null, true);
};

// Создаем multer instance с ограничениями
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Максимальный размер 50MB
    files: 5 // Максимум 5 файлов за раз
  }
});

// Middleware для проверки размера файла по типу
export const validateFileSize = (req: Request, res: any, next: any) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
  
  for (const file of files) {
    if (file) {
      const fileType = getFileType(file.mimetype);
      if (fileType && file.size > MAX_FILE_SIZES[fileType as keyof typeof MAX_FILE_SIZES]) {
        // Удаляем загруженный файл
        fs.unlinkSync(file.path);
        return next(new AppError(400, `Файл слишком большой. Максимальный размер для ${fileType}: ${MAX_FILE_SIZES[fileType as keyof typeof MAX_FILE_SIZES] / 1024 / 1024}MB`));
      }
    }
  }
  
  next();
};

// Утилита для удаления файла
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Утилита для получения публичного URL файла
export const getFileUrl = (filename: string, fileType: string): string => {
  return `/uploads/${fileType}/${filename}`;
};